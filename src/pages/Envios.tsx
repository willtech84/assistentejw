import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Designacao, Configuracoes } from "../lib/database.types";
import PageHeader from "../components/PageHeader";
import { abrirWhatsapp, montarMensagemDesignacao } from "../services/whatsapp";

export default function Envios() {
  const [pendentes, setPendentes] = useState<Designacao[]>([]);
  const [config, setConfig] = useState<Configuracoes | null>(null);
  const [carregando, setCarregando] = useState(true);

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
    const { data: estudante } = await supabase
      .from("estudantes")
      .select("id, telefone")
      .ilike("nome", d.estudante)
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
    });

    abrirWhatsapp(estudante.telefone, mensagem);

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
