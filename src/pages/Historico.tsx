import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { HistoricoEnvio } from "../lib/database.types";
import PageHeader from "../components/PageHeader";

export default function Historico() {
  const [lista, setLista] = useState<HistoricoEnvio[]>([]);
  const [carregando, setCarregando] = useState(true);

  function carregar() {
    setCarregando(true);
    supabase
      .from("historico_envios")
      .select("*")
      .order("enviado_em", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setLista(data ?? []);
        setCarregando(false);
      });
  }

  useEffect(() => {
    carregar();
  }, []);

  async function excluir(h: HistoricoEnvio) {
    if (!confirm(`Excluir o registro de envio para "${h.estudante}"?`)) return;
    await supabase.from("historico_envios").delete().eq("id", h.id);
    carregar();
  }

  async function limparTudo() {
    if (
      !confirm(
        `Excluir TODO o histórico de envios (${lista.length} registros)? Essa ação não pode ser desfeita.`
      )
    )
      return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("historico_envios").delete().eq("user_id", user.id);
    carregar();
  }

  return (
    <div>
      <PageHeader
        title="Histórico de Envios"
        action={
          lista.length > 0 ? (
            <button
              onClick={limparTudo}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Limpar tudo
            </button>
          ) : undefined
        }
      />
      <div className="p-4 md:p-6">
        {carregando ? (
          <p className="text-sm text-slate-500">Carregando...</p>
        ) : lista.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum envio registrado ainda.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {lista.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {h.estudante}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(h.enviado_em).toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      h.sucesso
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {h.sucesso ? "Enviado" : "Falhou"}
                  </span>
                  <button
                    onClick={() => excluir(h)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
