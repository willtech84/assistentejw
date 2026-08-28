import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Designacao, Configuracoes } from "../lib/database.types";
import PageHeader from "../components/PageHeader";
import {
  abrirWhatsapp,
  enviarComAnexo,
  linkConfirmacao,
  montarMensagemDesignacao,
} from "../services/whatsapp";
import { gerarS89, nomeArquivoS89 } from "../services/s89";

export default function Envios() {
  const [pendentes, setPendentes] = useState<Designacao[]>([]);
  const [config, setConfig] = useState<Configuracoes | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [anexarPdf, setAnexarPdf] = useState(true);

  async function carregar() {
    setCarregando(true);
    const [{ data: designacoes }, { data: cfg }] = await Promise.all([
      supabase
        .from("designacoes")
        .select("*")
        .eq("whatsapp_enviado", false)
        .order("data_reuniao", { ascending: true }),
      supabase.from("configuracoes").select("*").maybeSingle(),
    ]);
    setPendentes(designacoes ?? []);
    setConfig(cfg ?? null);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function enviarUm(d: Designacao) {
    if (!d.estudante_id) {
      alert(
        `"${d.estudante}" não está vinculado a um estudante cadastrado. ` +
          `Vá em "Designações" e selecione o estudante antes de enviar.`
      );
      return;
    }

    const { data: estudante } = await supabase
      .from("estudantes")
      .select("id, telefone")
      .eq("id", d.estudante_id)
      .maybeSingle();

    if (!estudante?.telefone) {
      alert(`Telefone de "${d.estudante}" não cadastrado.`);
      return;
    }

    const mensagem = montarMensagemDesignacao({
      mensagemPadrao: config?.mensagem_padrao ?? "",
      nomeEstudante: d.estudante,
      tipo: d.tipo,
      semana: d.semana,
      linkConfirmacao: linkConfirmacao(d.token_confirmacao),
    });

    if (anexarPdf) {
      try {
        const pdfBytes = await gerarS89(d);
        const resultado = await enviarComAnexo(
          estudante.telefone,
          mensagem,
          pdfBytes,
          nomeArquivoS89(d)
        );
        if (resultado === "baixado") {
          alert(
            "O S-89 preenchido foi baixado e o WhatsApp abriu, mas sem mirar o contato certo " +
              "(limitação da folha de compartilhamento) — escolha o contato e arraste o arquivo pro chat."
          );
        } else {
          alert(
            "O WhatsApp abriu pra você escolher o contato (a folha de compartilhamento não sabe " +
              "abrir direto na conversa) — escolha o contato certo pra anexar o S-89."
          );
        }
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return; // cancelou a folha de compartilhamento
        alert(`Não foi possível gerar o S-89: ${(err as Error).message}`);
        return;
      }
    } else {
      abrirWhatsapp(estudante.telefone, mensagem);
    }

    await supabase.from("designacoes").update({ whatsapp_enviado: true }).eq("id", d.id);
    await supabase.from("historico_envios").insert({
      estudante_id: estudante.id,
      estudante: d.estudante,
      telefone: estudante.telefone,
      mensagem,
      sucesso: true,
      user_id: (await supabase.auth.getUser()).data.user?.id,
    });

    carregar();
  }

  return (
    <div>
      <PageHeader title="Fila de Envios" />
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2 md:px-6">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={anexarPdf}
            onChange={(e) => setAnexarPdf(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Anexar S-89 ao enviar
        </label>
        <span className="text-xs text-slate-400">
          {anexarPdf
            ? "— abre a folha de compartilhar; você escolhe o contato"
            : "— abre direto na conversa do contato, sem anexo"}
        </span>
      </div>
      <div className="p-4 md:p-6">
        <p className="mb-4 text-sm text-slate-500">
          Cada envio abre o WhatsApp com a mensagem pronta — confirme e clique
          em enviar por lá. Não há automação em segundo plano (isso exigiria
          a API oficial do WhatsApp Business).
        </p>

        {carregando ? (
          <p className="text-sm text-slate-500">Carregando...</p>
        ) : pendentes.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum envio pendente. 🎉</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {pendentes.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {d.estudante} — {d.tipo}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(d.data_reuniao + "T00:00:00").toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <button
                  onClick={() => enviarUm(d)}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                >
                  Enviar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
