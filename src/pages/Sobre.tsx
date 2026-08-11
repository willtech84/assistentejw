import PageHeader from "../components/PageHeader";

export default function Sobre() {
  return (
    <div>
      <PageHeader title="Sobre" />
      <div className="max-w-lg space-y-3 p-4 text-sm text-slate-600 md:p-6">
        <p className="font-medium text-slate-900">Assistente JW</p>
        <p>
          Assistente de designações para reunião semanal das Testemunhas de
          Jeová. PWA construído com React, TypeScript, Vite e Supabase.
        </p>
        <p className="text-xs text-slate-400">
          Envios via WhatsApp usam links wa.me — não há integração com a API
          oficial do WhatsApp Business.
        </p>
      </div>
    </div>
  );
}
