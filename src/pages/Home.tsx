import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import PageHeader from "../components/PageHeader";

interface Resumo {
  proximaReuniao: string | null;
  proximaSemana: string | null;
  designacoesPendentes: number;
  totalEstudantes: number;
}

export default function Home() {
  const [resumo, setResumo] = useState<Resumo | null>(null);

  useEffect(() => {
    async function carregar() {
      const hoje = new Date().toISOString().slice(0, 10);

      const [{ data: proxima }, { count: pendentes }, { count: estudantes }] =
        await Promise.all([
          supabase
            .from("designacoes")
            .select("data_reuniao, semana")
            .gte("data_reuniao", hoje)
            .order("data_reuniao", { ascending: true })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("designacoes")
            .select("id", { count: "exact", head: true })
            .eq("whatsapp_enviado", false),
          supabase
            .from("estudantes")
            .select("id", { count: "exact", head: true })
            .eq("ativo", true),
        ]);

      setResumo({
        proximaReuniao: proxima?.data_reuniao ?? null,
        proximaSemana: proxima?.semana ?? null,
        designacoesPendentes: pendentes ?? 0,
        totalEstudantes: estudantes ?? 0,
      });
    }
    carregar();
  }, []);

  return (
    <div>
      <PageHeader title="Início" />
      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:p-6 lg:grid-cols-3">
        <Cartao
          titulo="Próxima reunião"
          valor={
            resumo?.proximaReuniao
              ? new Date(resumo.proximaReuniao + "T00:00:00").toLocaleDateString("pt-BR")
              : "—"
          }
          subtitulo={resumo?.proximaSemana ? `Semana: ${resumo.proximaSemana}` : undefined}
          link="/designacoes"
        />
        <Cartao
          titulo="Designações pendentes de envio"
          valor={String(resumo?.designacoesPendentes ?? "—")}
          link="/designacoes"
        />
        <Cartao
          titulo="Estudantes ativos"
          valor={String(resumo?.totalEstudantes ?? "—")}
          link="/estudantes"
        />
      </div>
    </div>
  );
}

function Cartao({
  titulo,
  valor,
  subtitulo,
  link,
}: {
  titulo: string;
  valor: string;
  subtitulo?: string;
  link: string;
}) {
  return (
    <Link
      to={link}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <p className="text-sm text-slate-500">{titulo}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{valor}</p>
      {subtitulo && <p className="mt-1 text-xs text-slate-400">{subtitulo}</p>}
    </Link>
  );
}
