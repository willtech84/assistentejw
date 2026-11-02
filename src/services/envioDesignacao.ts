// Fluxo único de envio de designação por WhatsApp — usado por
// Designações e Fila de Envios, para os dois não divergirem.
//
// Regras importantes:
// 1) Quando o envio NAVEGA para o WhatsApp (location.href), o app pode
//    ser suspenso e o código que vem depois nunca roda. Por isso o
//    status "enviado" + histórico são gravados ANTES de abrir o
//    WhatsApp (nos modos que navegam).
// 2) Modo "link" (padrão): gera o S-89 preenchido, sobe no Storage e
//    manda o link assinado DENTRO da mensagem, abrindo direto na
//    conversa do contato — mensagem e S-89 vão juntos.
// 3) Modo "anexo": folha de compartilhar do Android (o WhatsApp pode
//    descartar o texto e o app não consegue escolher o contato).
// 4) Modo "nenhum": só a mensagem.

import { supabase } from "../lib/supabase";
import { formatarDataBR } from "../lib/datas";
import type { Configuracoes, Designacao } from "../lib/database.types";
import { gerarS89, nomeArquivoS89, ehParteDeEstudante } from "./s89";
import {
  abrirWhatsapp,
  enviarComAnexo,
  linkConfirmacao,
  montarMensagemDesignacao,
  montarMensagemDesignacaoOutras,
} from "./whatsapp";

export type ModoS89 = "link" | "anexo" | "nenhum";

const CHAVE_MODO = "assistentejw:modoS89";
const VALIDADE_LINK_SEGUNDOS = 60 * 60 * 24 * 30; // 30 dias

export function lerModoS89(): ModoS89 {
  try {
    const v = localStorage.getItem(CHAVE_MODO);
    if (v === "link" || v === "anexo" || v === "nenhum") return v;
  } catch {
    // localStorage indisponível — usa o padrão
  }
  return "link";
}

export function salvarModoS89(modo: ModoS89) {
  try {
    localStorage.setItem(CHAVE_MODO, modo);
  } catch {
    // não crítico
  }
}

async function buscarTelefone(d: Designacao): Promise<string | null> {
  if (!d.estudante_id) {
    alert(
      `"${d.estudante}" não está vinculado a um estudante cadastrado. ` +
        `Edite esta designação e selecione o estudante na lista antes de enviar.`
    );
    return null;
  }
  const { data: estudante } = await supabase
    .from("estudantes")
    .select("telefone")
    .eq("id", d.estudante_id)
    .maybeSingle();
  if (!estudante?.telefone) {
    alert(`Telefone de "${d.estudante}" não encontrado no cadastro de estudantes.`);
    return null;
  }
  return estudante.telefone;
}

async function registrarEnvio(
  d: Designacao,
  telefone: string,
  mensagem: string,
  marcarComoEnviada = true
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (marcarComoEnviada) {
    await supabase.from("designacoes").update({ whatsapp_enviado: true }).eq("id", d.id);
  }
  await supabase.from("historico_envios").insert({
    estudante_id: d.estudante_id,
    estudante: d.estudante,
    telefone,
    mensagem,
    sucesso: true,
    user_id: user?.id,
  });
}

async function confirmarAntes(config: Configuracoes | null): Promise<boolean> {
  if (config?.confirmar_antes_enviar === false) return true;
  return confirm("Abrir o WhatsApp e marcar esta designação como enviada?");
}

/** Gera o S-89, sobe no bucket privado "pdfs" e devolve um link assinado (30 dias). */
async function gerarLinkS89(d: Designacao): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada — entre novamente.");

  const bytes = await gerarS89(d);
  const caminho = `${user.id}/s89/${d.id}.pdf`;

  // a policy do bucket não permite UPDATE (upsert) — remove e sobe de novo
  await supabase.storage.from("pdfs").remove([caminho]);
  const { error: erroUpload } = await supabase.storage
    .from("pdfs")
    .upload(caminho, new Blob([new Uint8Array(bytes)], { type: "application/pdf" }), {
      contentType: "application/pdf",
    });
  if (erroUpload) throw new Error(`Falha ao subir o S-89: ${erroUpload.message}`);

  const { data, error } = await supabase.storage
    .from("pdfs")
    .createSignedUrl(caminho, VALIDADE_LINK_SEGUNDOS);
  if (error || !data?.signedUrl) {
    throw new Error(`Falha ao gerar o link do S-89: ${error?.message ?? "sem URL"}`);
  }
  return data.signedUrl;
}

/** Parte de estudante (com ou sem S-89, conforme o modo escolhido). */
export async function enviarDesignacaoEstudante(
  d: Designacao,
  config: Configuracoes | null,
  modo: ModoS89
): Promise<boolean> {
  const telefone = await buscarTelefone(d);
  if (!telefone) return false;

  const usaS89 = ehParteDeEstudante(d.tipo) && modo !== "nenhum";
  const base = {
    mensagemPadrao: config?.mensagem_padrao ?? "",
    nomeEstudante: d.estudante,
    tipo: d.tipo,
    dataReuniao: d.data_reuniao,
    linkConfirmacao: linkConfirmacao(d.token_confirmacao),
  };

  // --- modo "anexo": folha de compartilhar (não navega, então marca depois)
  if (usaS89 && modo === "anexo") {
    const mensagem = montarMensagemDesignacao(base);
    try {
      const pdfBytes = await gerarS89(d);
      const resultado = await enviarComAnexo(telefone, mensagem, pdfBytes, nomeArquivoS89(d));
      alert(
        resultado === "baixado"
          ? "O S-89 foi baixado e o WhatsApp abriu, mas sem mirar o contato — escolha o contato e anexe o arquivo."
          : "Escolha o contato na folha de compartilhar. Se a mensagem não aparecer, ela já está copiada: é só colar."
      );
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return false;
      alert(`Não foi possível gerar o S-89: ${(err as Error).message}`);
      return false;
    }
    if (await confirmarAntes(config)) await registrarEnvio(d, telefone, mensagem);
    return true;
  }

  // --- modos que navegam pro WhatsApp (link / nenhum)
  let linkS89: string | undefined;
  if (usaS89 && modo === "link") {
    try {
      linkS89 = await gerarLinkS89(d);
    } catch (err) {
      alert((err as Error).message);
      return false;
    }
  }

  const mensagem = montarMensagemDesignacao({ ...base, linkS89 });
  if (!(await confirmarAntes(config))) return false;
  await registrarEnvio(d, telefone, mensagem); // ANTES de navegar
  abrirWhatsapp(telefone, mensagem);
  return true;
}

/** Partes sem S-89 (Presidente, Oração, Dirigentes, Estudo Bíblico, discursos). */
export async function enviarDesignacaoOutras(
  d: Designacao,
  config: Configuracoes | null,
  tipoMensagem: "designacao" | "confirmacao"
): Promise<boolean> {
  const telefone = await buscarTelefone(d);
  if (!telefone) return false;

  const mensagem = montarMensagemDesignacaoOutras({
    modelo:
      (tipoMensagem === "designacao"
        ? config?.mensagem_designacao_outras
        : config?.mensagem_confirmacao_outras) ?? "",
    nomeEstudante: d.estudante,
    tipo: d.tipo,
    dataReuniao: d.data_reuniao,
    linkConfirmacao: linkConfirmacao(d.token_confirmacao),
  });

  if (!(await confirmarAntes(config))) return false;
  // "Pedir confirmação" também conta como enviada: a pessoa recebeu a
  // designação + link, então não pode continuar aparecendo "não enviada".
  await registrarEnvio(
    d,
    telefone,
    tipoMensagem === "designacao"
      ? `${d.tipo} — ${formatarDataBR(d.data_reuniao)}`
      : `Lembrete de confirmação — ${d.tipo} — ${formatarDataBR(d.data_reuniao)}`
  );
  abrirWhatsapp(telefone, mensagem);
  return true;
}
