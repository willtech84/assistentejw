import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Reuniao } from "../lib/database.types";
import PageHeader from "../components/PageHeader";

export default function Agenda() {
  const [lista, setLista] = useState<Reuniao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState<Partial<Reuniao> | null>(null);

  async function carregar() {
    setCarregando(true);
    const { data } = await supabase
      .from("reunioes")
      .select("*")
      .order("data", { ascending: true });
    setLista(data ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!editando?.data) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const payload = { ...editando, user_id: user.id };

    if (editando.id) {
      await supabase.from("reunioes").update(payload).eq("id", editando.id);
    } else {
      await supabase.from("reunioes").insert(payload);
    }
    setEditando(null);
    carregar();
  }

  return (
    <div>
      <PageHeader
        title="Agenda"
        action={
          <button
            onClick={() => setEditando({})}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Reunião
          </button>
        }
      />

      <div className="p-4 md:p-6">
        {carregando ? (
          <p className="text-sm text-slate-500">Carregando...</p>
        ) : lista.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma reunião cadastrada.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {lista.map((r) => (
              <button
                key={r.id}
                onClick={() => setEditando(r)}
                className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {new Date(r.data + "T00:00:00").toLocaleDateString("pt-BR", {
                      weekday: "long",
                      day: "2-digit",
                      month: "long",
                    })}
                  </p>
                  <p className="text-sm text-slate-500">{r.semana || r.tema}</p>
                </div>
                {r.importada && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                    Importada
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {editando && (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/30 sm:items-center sm:p-4">
          <form
            onSubmit={salvar}
            className="w-full max-w-md space-y-4 rounded-t-2xl bg-white p-6 sm:rounded-2xl"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              {editando.id ? "Editar reunião" : "Nova reunião"}
            </h2>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Data
              </label>
              <input
                type="date"
                required
                value={editando.data ?? ""}
                onChange={(e) => setEditando({ ...editando, data: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {(["semana", "presidente", "leitor"] as const).map((campo) => (
              <div key={campo}>
                <label className="mb-1 block text-sm font-medium capitalize text-slate-700">
                  {campo}
                </label>
                <input
                  value={editando[campo] ?? ""}
                  onChange={(e) =>
                    setEditando({ ...editando, [campo]: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
            ))}

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
