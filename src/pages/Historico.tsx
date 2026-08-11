import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { HistoricoEnvio } from "../lib/database.types";
import PageHeader from "../components/PageHeader";

export default function Historico() {
  const [lista, setLista] = useState<HistoricoEnvio[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    supabase
      .from("historico_envios")
      .select("*")
      .order("enviado_em", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setLista(data ?? []);
        setCarregando(false);
      });
  }, []);

  return (
    <div>
      <PageHeader title="Histórico de Envios" />
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
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    h.sucesso
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {h.sucesso ? "Enviado" : "Falhou"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
