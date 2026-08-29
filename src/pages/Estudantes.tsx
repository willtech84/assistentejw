import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Estudante } from "../lib/database.types";
import PageHeader from "../components/PageHeader";

function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function Estudantes() {
  const [lista, setLista] = useState<Estudante[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState<Partial<Estudante> | null>(null);

  async function carregar() {
    setCarregando(true);
    const { data } = await supabase
      .from("estudantes")
      .select("*")
      .order("nome", { ascending: true });
    setLista(data ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!editando) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      ...editando,
      nome_pesquisa: normalizar(editando.nome ?? ""),
      user_id: user.id,
    };

    if (editando.id) {
      await supabase.from("estudantes").update(payload).eq("id", editando.id);
    } else {
      await supabase.from("estudantes").insert(payload);
    }

    setEditando(null);
    carregar();
  }

  async function remover(id: string) {
    if (!confirm("Remover este estudante?")) return;
    await supabase.from("estudantes").delete().eq("id", id);
    carregar();
  }

  const filtrados = lista.filter((e) =>
    normalizar(e.nome).includes(normalizar(busca))
  );

  return (
    <div>
      <PageHeader
        title="Estudantes"
        action={
          <button
            onClick={() => setEditando({})}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Novo
          </button>
        }
      />

      <div className="p-4 md:p-6">
        <input
          placeholder="Buscar por nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="mb-4 w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />

        {carregando ? (
          <p className="text-sm text-slate-500">Carregando...</p>
        ) : filtrados.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum estudante encontrado.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Nome</th>
                  <th className="hidden px-4 py-2 font-medium sm:table-cell">Telefone</th>
                  <th className="hidden px-4 py-2 font-medium md:table-cell">Status</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {filtrados.map((e) => (
                  <tr key={e.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2 text-slate-900">{e.nome}</td>
                    <td className="hidden px-4 py-2 text-slate-500 sm:table-cell">
                      {e.telefone || "—"}
                    </td>
                    <td className="hidden px-4 py-2 md:table-cell">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          e.ativo
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {e.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => setEditando(e)}
                        className="mr-2 text-indigo-600 hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => remover(e.id)}
                        className="text-red-600 hover:underline"
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editando && (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/30 p-0 sm:items-center sm:p-4">
          <form
            onSubmit={salvar}
            className="w-full max-w-md space-y-4 rounded-t-2xl bg-white p-6 sm:rounded-2xl"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              {editando.id ? "Editar estudante" : "Novo estudante"}
            </h2>

            <Campo
              label="Nome"
              value={editando.nome ?? ""}
              onChange={(v) => setEditando({ ...editando, nome: v })}
              required
            />
            <Campo
              label="Telefone (WhatsApp)"
              value={editando.telefone ?? ""}
              onChange={(v) => setEditando({ ...editando, telefone: v })}
              placeholder="+55 11 91234-5678"
            />
            <Campo
              label="E-mail"
              value={editando.email ?? ""}
              onChange={(v) => setEditando({ ...editando, email: v })}
            />

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={editando.ativo ?? true}
                onChange={(e) =>
                  setEditando({ ...editando, ativo: e.target.checked })
                }
              />
              Ativo
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={editando.recebe_whatsapp ?? true}
                onChange={(e) =>
                  setEditando({ ...editando, recebe_whatsapp: e.target.checked })
                }
              />
              Recebe designações por WhatsApp
            </label>

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

function Campo({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
      />
    </div>
  );
}
