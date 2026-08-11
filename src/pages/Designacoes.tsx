import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Designacao, Configuracoes } from "../lib/database.types";
import PageHeader from "../components/PageHeader";
import { abrirWhatsapp, montarMensagemDesignacao } from "../services/whatsapp";

const TIPOS = [
  "Presidente",
  "Leitor",
  "Tesouros da Palavra de Deus",
  "Joias Espirituais",
  "Leitura da Bíblia",
  "Faça Seu Melhor no Ministério",
  "Nossa Vida Cristã",
  "Estudo Bíblico de Congregação",
  "Oração Inicial",
  "Oração Final",
];

export default function Designacoes() {
  const [lista, setLista] = useState<Designacao[]>([]);
  const [config, setConfig] = useState<Configuracoes | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState<Partial<Designacao> | null>(null);

  async function carregar() {
    setCarregando(true);
    const hoje = new Date();
    hoje.setDate(hoje.getDate() - 7); // mostra também a última semana

    const [{ data: designacoes }, { data: cfg }] = await Promise.all([
      supabase
        .from("designacoes")
        .select("*")
        .gte("data_reuniao", hoje.toISOString().slice(0, 10))
        .order("data_reuniao", { ascending: true }),
      supabase.from("configuracoes").select("*").maybeSingle(),
    ]);

    setLista(designacoes ?? []);
    setConfig(cfg ?? null);
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

    const payload = { ...editando, user_id: user.id };

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
    const mensagem = montarMensagemDesignacao({
      mensagemPadrao: config?.mensagem_padrao ?? "",
      nomeEstudante: d.estudante,
      tipo: d.tipo,
      semana: d.semana,
    });

    // O telefone precisa vir do cadastro de estudantes; aqui buscamos
    // por nome já que a designação guarda o nome como texto livre
    // (mesmo modelo do app original).
    const { data: estudante } = await supabase
      .from("estudantes")
      .select("telefone")
      .ilike("nome", d.estudante)
      .maybeSingle();

    if (!estudante?.telefone) {
      alert(
        `Telefone de "${d.estudante}" não encontrado no cadastro de estudantes.`
      );
      return;
    }

    abrirWhatsapp(estudante.telefone, mensagem);
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
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <Campo
              label="Estudante"
              value={editando.estudante ?? ""}
              onChange={(v) => setEditando({ ...editando, estudante: v })}
              required
            />
            <Campo
              label="Ajudante (opcional)"
              value={editando.ajudante ?? ""}
              onChange={(v) => setEditando({ ...editando, ajudante: v })}
            />
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
