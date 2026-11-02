import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Designacao, Configuracoes } from "../lib/database.types";
import PageHeader from "../components/PageHeader";
import {
  enviarDesignacaoEstudante,
  enviarDesignacaoOutras as enviarOutras,
  lerModoS89,
  type ModoS89,
} from "../services/envioDesignacao";
import ModoS89Select from "../components/ModoS89";
import { formatarDataBR } from "../lib/datas";
import { ehParteDeEstudante } from "../services/s89";

export default function Envios() {
  const [pendentes, setPendentes] = useState<Designacao[]>([]);
  const [config, setConfig] = useState<Configuracoes | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [modoS89, setModoS89] = useState<ModoS89>(lerModoS89());

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
    if (ehParteDeEstudante(d.tipo)) {
      await enviarDesignacaoEstudante(d, config, modoS89);
    } else {
      await enviarOutras(d, config, "designacao");
    }
    carregar();
  }

  return (
    <div>
      <PageHeader title="Fila de Envios" />
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2 md:px-6">
        <ModoS89Select value={modoS89} onChange={setModoS89} />
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
                    {formatarDataBR(d.data_reuniao)}
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
