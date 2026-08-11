import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Configuracoes as ConfiguracoesType } from "../lib/database.types";
import PageHeader from "../components/PageHeader";

const PADRAO: Partial<ConfiguracoesType> = {
  congregacao: "",
  circuito: "",
  tema: "system",
  notificacoes: true,
  confirmar_antes_enviar: true,
  mensagem_padrao:
    "Olá! Segue em anexo sua designação desta semana. Tenha uma excelente reunião!",
};

export default function Configuracoes() {
  const [config, setConfig] = useState<Partial<ConfiguracoesType>>(PADRAO);
  const [carregando, setCarregando] = useState(true);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    supabase
      .from("configuracoes")
      .select("*")
      .maybeSingle()
      .then(({ data }) => {
        if (data) setConfig(data);
        setCarregando(false);
      });
  }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("configuracoes")
      .upsert({ ...config, user_id: user.id }, { onConflict: "user_id" });

    setSalvo(true);
    setTimeout(() => setSalvo(false), 2000);
  }

  if (carregando) {
    return (
      <div>
        <PageHeader title="Configurações" />
        <p className="p-6 text-sm text-slate-500">Carregando...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Configurações" />
      <form onSubmit={salvar} className="max-w-lg space-y-5 p-4 md:p-6">
        <Campo
          label="Congregação"
          value={config.congregacao ?? ""}
          onChange={(v) => setConfig({ ...config, congregacao: v })}
        />
        <Campo
          label="Circuito"
          value={config.circuito ?? ""}
          onChange={(v) => setConfig({ ...config, circuito: v })}
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Mensagem padrão de envio
          </label>
          <textarea
            value={config.mensagem_padrao ?? ""}
            onChange={(e) =>
              setConfig({ ...config, mensagem_padrao: e.target.value })
            }
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <Toggle
          label="Confirmar antes de marcar como enviado"
          checked={config.confirmar_antes_enviar ?? true}
          onChange={(v) => setConfig({ ...config, confirmar_antes_enviar: v })}
        />
        <Toggle
          label="Salvar histórico de envios"
          checked={config.salvar_historico ?? true}
          onChange={(v) => setConfig({ ...config, salvar_historico: v })}
        />
        <Toggle
          label="Notificações"
          checked={config.notificacoes ?? true}
          onChange={(v) => setConfig({ ...config, notificacoes: v })}
        />

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Salvar
          </button>
          {salvo && (
            <span className="text-sm text-emerald-600">Salvo com sucesso!</span>
          )}
        </div>
      </form>
    </div>
  );
}

function Campo({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
      />
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}
