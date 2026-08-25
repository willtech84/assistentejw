import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Designacao, Configuracoes } from "../lib/database.types";
import PageHeader from "../components/PageHeader";
import { enviarComAnexo, montarMensagemDesignacao } from "../services/whatsapp";
import { gerarS89, nomeArquivoS89 } from "../services/s89";
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

  async function marcarEnviada(d: Designacao) {
    await supabase
      .from("designacoes")
      .update({ whatsapp_enviado: true })
      .eq("id", d.id);
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
          "O S-89 preenchido foi baixado e o WhatsApp abriu com a mensagem pronta — " +
            "arraste o arquivo baixado pro chat que abriu para anexar."
        );
      }
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return; // cancelou a folha de compartilhamento
      alert(`Não foi possível gerar o S-89: ${(err as Error).message}`);
      return;
    }
    if (config?.confirmar_antes_enviar !== false) {
      if (confirm("Marcar esta designação como enviada?")) {
        await marcarEnviada(d);
      }
    } else {
      await marcarEnviada(d);
    }
  }

  const porSemana = agrupar(lista);

  return (
    <div>
      <PageHeader
        title="Designações"
        action={
          <button
            onClick={() => setEditando({ sala: "Principal" })}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Nova
          </button>
        }
      />

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
              <h2 className="mb-2 text-sm font-semibold text-slate-500">
                {new Date(itens[0].data_reuniao + "T00:00:00").toLocaleDateString(
                  "pt-BR",
                  { weekday: "long", day: "2-digit", month: "long" }
                )}
                {semana ? ` — ${semana}` : ""}
              </h2>
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
                      {d.whatsapp_enviado ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                          Enviado
                        </span>
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
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
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
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
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
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
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
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
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
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
      />
    </div>
  );
}
