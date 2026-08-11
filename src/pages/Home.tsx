import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import PageHeader from "../components/PageHeader";

interface Resumo {
  proximaReuniao: string | null;
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
            .from("reunioes")
            .select("data")
            .gte("data", hoje)
            .order("data", { ascending: true })
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
        proximaReuniao: proxima?.data ?? null,
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
          link="/agenda"
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
  link,
}: {
  titulo: string;
  valor: string;
  link: string;
}) {
  return (
    <Link
      to={link}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <p className="text-sm text-slate-500">{titulo}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{valor}</p>
    </Link>
  );
}
