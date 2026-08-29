import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Designacao, Configuracoes } from "../lib/database.types";
import PageHeader from "../components/PageHeader";
import { abrirWhatsapp, enviarComAnexo, linkConfirmacao, montarMensagemDesignacao } from "../services/whatsapp";
import { gerarS89, nomeArquivoS89 } from "../services/s89";
import { gerarResumoSemanal, nomeArquivoResumo } from "../services/resumoSemanal";
import {
  carregarEstudantesDoUsuario,
  type EstudanteBasico,
} from "../services/estudanteMatch";
import { TIPOS_DESIGNACAO } from "../lib/constants";

export default function Designacoes() {
  const [lista, setLista] = useState<Designacao[]>([]);
  const [config, setConfig] = useState<Configuracoes | null>(null);
  const [estudantes, setEstudantes] = useState<EstudanteBasico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState<Partial<Designacao> | null>(null);
  const [anexarPdf, setAnexarPdf] = useState(true);

  async function carregar() {
    setCarregando(true);
    const hoje = new Date();
    hoje.setDate(hoje.getDate() - 7); // mostra também a última semana

    const [{ data: designacoes }, { data: cfg }, listaEstudantes] =
      await Promise.all([
        supabase
          .from("designacoes")
          .select("*")
          .gte("data_reuniao", hoje.toISOString().slice(0, 10))
          .order("data_reuniao", { ascending: true }),
        supabase.from("configuracoes").select("*").maybeSingle(),
        carregarEstudantesDoUsuario(),
      ]);

    setLista(designacoes ?? []);
    setConfig(cfg ?? null);
    setEstudantes(listaEstudantes);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!editando?.data_reuniao) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const estudanteSelecionado = estudantes.find(
      (e) => e.id === editando.estudante_id
    );
    const payload = {
      ...editando,
      estudante: estudanteSelecionado?.nome ?? editando.estudante ?? "",
      user_id: user.id,
    };

    if (editando.id) {
      await supabase.from("designacoes").update(payload).eq("id", editando.id);
    } else {
      await supabase.from("designacoes").insert(payload);
    }

    setEditando(null);
    carregar();
  }

  async function marcarEnviada(d: Designacao, telefone: string) {
    await supabase
      .from("designacoes")
      .update({ whatsapp_enviado: true })
      .eq("id", d.id);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("historico_envios").insert({
      estudante_id: d.estudante_id,
      estudante: d.estudante,
      telefone,
      mensagem: `${d.tipo} — ${d.semana}`,
      sucesso: true,
      user_id: user?.id,
    });
    carregar();
  }

  async function enviar(d: Designacao) {
    if (!d.estudante) return;

    if (!d.estudante_id) {
      alert(
        `"${d.estudante}" não está vinculado a um estudante cadastrado. ` +
          `Edite esta designação e selecione o estudante na lista antes de enviar.`
      );
      return;
    }

    const mensagem = montarMensagemDesignacao({
      mensagemPadrao: config?.mensagem_padrao ?? "",
      nomeEstudante: d.estudante,
      tipo: d.tipo,
      semana: d.semana,
      linkConfirmacao: linkConfirmacao(d.token_confirmacao),
    });

    // Telefone vem do cadastro via estudante_id (FK) — não mais por
    // casamento de nome em tempo de execução, que falhava
    // silenciosamente com nomes duplicados ou digitação diferente.
    const { data: estudante } = await supabase
      .from("estudantes")
      .select("telefone")
      .eq("id", d.estudante_id)
      .maybeSingle();

    if (!estudante?.telefone) {
      alert(
        `Telefone de "${d.estudante}" não encontrado no cadastro de estudantes.`
      );
      return;
    }

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

    if (config?.confirmar_antes_enviar !== false) {
      if (confirm("Marcar esta designação como enviada?")) {
        await marcarEnviada(d, estudante.telefone);
      }
    } else {
      await marcarEnviada(d, estudante.telefone);
    }
  }

  async function excluir(d: Designacao) {
    if (!confirm(`Excluir a designação de "${d.estudante || d.tipo}"?`)) return;
    await supabase.from("designacoes").delete().eq("id", d.id);
    carregar();
  }

  async function limparTudo() {
    if (
      !confirm(
        `Excluir TODAS as ${lista.length} designações cadastradas? Essa ação não pode ser desfeita.`
      )
    )
      return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("designacoes").delete().eq("user_id", user.id);
    carregar();
  }

  async function baixarResumoSemana(semana: string, itens: Designacao[]) {
    try {
      const pdfBytes = await gerarResumoSemanal(itens, semana || "sem nome");
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = nomeArquivoResumo(semana || "semana");
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Não foi possível gerar o resumo: ${(err as Error).message}`);
    }
  }

  const porSemana = agrupar(lista);

  return (
    <div>
      <PageHeader
        title="Designações"
        action={
          <div className="flex items-center gap-2">
            {lista.length > 0 && (
              <button
                onClick={limparTudo}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Limpar tudo
              </button>
            )}
            <button
              onClick={() => setEditando({ sala: "Principal" })}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              + Nova
            </button>
          </div>
        }
      />

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

      <div className="space-y-6 p-4 md:p-6">
        {carregando ? (
          <p className="text-sm text-slate-500">Carregando...</p>
        ) : lista.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nenhuma designação cadastrada. Crie uma manualmente ou importe uma
            planilha Excel em "PDFs".
          </p>
        ) : (
          Object.entries(porSemana).map(([semana, itens]) => (
            <div key={semana}>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-500">
                  {new Date(itens[0].data_reuniao + "T00:00:00").toLocaleDateString(
                    "pt-BR",
                    { weekday: "long", day: "2-digit", month: "long" }
                  )}
                  {semana ? ` — ${semana}` : ""}
                </h2>
                <button
                  onClick={() => baixarResumoSemana(semana, itens)}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Baixar resumo de confirmações
                </button>
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                {itens.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {d.tipo || "(sem tipo)"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {d.estudante || "—"}
                        {d.ajudante ? ` + ${d.ajudante}` : ""}
                        {d.estudante && !d.estudante_id && (
                          <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                            sem vínculo
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {d.whatsapp_enviado && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            d.confirmacao_status === "confirmado"
                              ? "bg-emerald-100 text-emerald-700"
                              : d.confirmacao_status === "recusado"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                          }`}
                          title={
                            d.confirmacao_status === "recusado" && d.substituto_sugerido
                              ? `Substituto sugerido: ${d.substituto_sugerido}`
                              : undefined
                          }
                        >
                          {d.confirmacao_status === "confirmado"
                            ? "✅ Confirmado"
                            : d.confirmacao_status === "recusado"
                              ? "❌ Não vai poder"
                              : "⏳ Aguardando"}
                        </span>
                      )}
                      {d.whatsapp_enviado ? (
                        <button
                          onClick={() => enviar(d)}
                          className="rounded-lg border border-emerald-200 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                        >
                          Reenviar
                        </button>
                      ) : (
                        <button
                          onClick={() => enviar(d)}
                          className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                        >
                          Enviar WhatsApp
                        </button>
                      )}
                      <button
                        onClick={() => setEditando(d)}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => excluir(d)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {editando && (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/30 sm:items-center sm:p-4">
          <form
            onSubmit={salvar}
            className="w-full max-w-md space-y-4 rounded-t-2xl bg-white p-6 sm:rounded-2xl"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              {editando.id ? "Editar designação" : "Nova designação"}
            </h2>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Data da reunião
              </label>
              <input
                type="date"
                required
                value={editando.data_reuniao ?? ""}
                onChange={(e) =>
                  setEditando({ ...editando, data_reuniao: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Tipo de designação
              </label>
              <select
                required
                value={editando.tipo ?? ""}
                onChange={(e) =>
                  setEditando({ ...editando, tipo: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              >
                <option value="" disabled>
                  Selecione...
                </option>
                {TIPOS_DESIGNACAO.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Estudante
              </label>
              <select
                required
                value={editando.estudante_id ?? ""}
                onChange={(e) =>
                  setEditando({ ...editando, estudante_id: e.target.value || null })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              >
                <option value="" disabled>
                  Selecione...
                </option>
                {estudantes.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nome}
                  </option>
                ))}
              </select>
              {estudantes.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  Nenhum estudante cadastrado ainda — cadastre em
                  "Estudantes" primeiro.
                </p>
              )}
            </div>
            <Campo
              label="Ajudante (opcional)"
              value={editando.ajudante ?? ""}
              onChange={(v) => setEditando({ ...editando, ajudante: v })}
            />
            <Campo
              label="Número da parte (para o S-89)"
              value={editando.numero_parte ?? ""}
              onChange={(v) => setEditando({ ...editando, numero_parte: v })}
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Local
              </label>
              <select
                value={editando.sala ?? "Principal"}
                onChange={(e) =>
                  setEditando({ ...editando, sala: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              >
                <option value="Principal">Salão principal</option>
                <option value="B">Sala B</option>
                <option value="C">Sala C</option>
              </select>
            </div>
            <Campo
              label="Semana (ex: 11-17 de agosto)"
              value={editando.semana ?? ""}
              onChange={(v) => setEditando({ ...editando, semana: v })}
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditando(null)}
                className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function agrupar(lista: Designacao[]): Record<string, Designacao[]> {
  return lista.reduce<Record<string, Designacao[]>>((acc, d) => {
    const chave = d.data_reuniao;
    acc[chave] = acc[chave] ? [...acc[chave], d] : [d];
    return acc;
  }, {});
}

function Campo({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
      />
    </div>
  );
}
