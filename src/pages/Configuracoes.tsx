import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Configuracoes as ConfiguracoesType } from "../lib/database.types";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../hooks/useAuth";
import {
  ativarNotificacoes,
  desativarNotificacoes,
  statusPermissao,
  suportaPush,
  temInscricaoAtiva,
} from "../services/push";

const PADRAO: Partial<ConfiguracoesType> = {
  congregacao: "",
  circuito: "",
  tema: "system",
  notificacoes: true,
  confirmar_antes_enviar: true,
  mensagem_padrao:
    "Olá! Segue em anexo sua designação desta semana. Tenha uma excelente reunião!",
  mensagem_designacao_outras:
    "Olá! Você foi designado(a) para: {tipo}, na semana {semana}.",
  mensagem_confirmacao_outras:
    "Olá! Lembrete da sua designação ({tipo}) na semana {semana}. Por favor confirme sua participação.",
};

export default function Configuracoes() {
  const { user } = useAuth();
  const [config, setConfig] = useState<Partial<ConfiguracoesType>>(PADRAO);
  const [carregando, setCarregando] = useState(true);
  const [salvo, setSalvo] = useState(false);
  const [statusPush, setStatusPush] = useState(statusPermissao());
  const [inscricaoAtiva, setInscricaoAtiva] = useState(false);
  const [erroPush, setErroPush] = useState("");
  const [sucessoPush, setSucessoPush] = useState("");
  const [ativandoPush, setAtivandoPush] = useState(false);

  useEffect(() => {
    temInscricaoAtiva().then(setInscricaoAtiva);
  }, []);

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
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-slate-400">
            Usada pra partes de estudante (com ou sem o S-89 anexado).
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Mensagem de designação (partes sem S-89)
          </label>
          <textarea
            value={config.mensagem_designacao_outras ?? ""}
            onChange={(e) =>
              setConfig({ ...config, mensagem_designacao_outras: e.target.value })
            }
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-slate-400">
            Pra Presidente, Oração, Dirigentes, Estudo Bíblico e discursos —
            o primeiro aviso da designação. Use {"{tipo}"} e {"{semana}"}.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Mensagem de confirmação (partes sem S-89)
          </label>
          <textarea
            value={config.mensagem_confirmacao_outras ?? ""}
            onChange={(e) =>
              setConfig({ ...config, mensagem_confirmacao_outras: e.target.value })
            }
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-slate-400">
            Lembrete separado, enviado depois, pra confirmar presença na
            semana. Use {"{tipo}"} e {"{semana}"}.
          </p>
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

        {suportaPush() && (
          <div className="rounded-lg border border-slate-200 p-3 text-sm">
            <p className="mb-2 text-slate-600">
              Lembrete automático de designações pendentes, enviado por
              notificação push neste navegador/dispositivo.
            </p>
            {inscricaoAtiva ? (
              <button
                type="button"
                disabled={ativandoPush}
                onClick={async () => {
                  setAtivandoPush(true);
                  setErroPush("");
                  setSucessoPush("");
                  try {
                    await desativarNotificacoes();
                    setStatusPush(statusPermissao());
                    setInscricaoAtiva(await temInscricaoAtiva());
                    setSucessoPush("Notificações desativadas neste dispositivo.");
                  } catch (e) {
                    setErroPush((e as Error).message);
                  } finally {
                    setAtivandoPush(false);
                  }
                }}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Desativar neste dispositivo
              </button>
            ) : (
              <button
                type="button"
                disabled={ativandoPush || !user}
                onClick={async () => {
                  if (!user) return;
                  setAtivandoPush(true);
                  setErroPush("");
                  setSucessoPush("");
                  try {
                    await ativarNotificacoes(user.id);
                    setStatusPush(statusPermissao());
                    const ativo = await temInscricaoAtiva();
                    setInscricaoAtiva(ativo);
                    if (ativo) {
                      setSucessoPush(
                        "Ativado! Você vai receber um lembrete neste dispositivo quando houver designações pendentes perto da reunião."
                      );
                    } else {
                      setErroPush(
                        "A permissão foi concedida, mas não foi possível confirmar a inscrição. Tente de novo."
                      );
                    }
                  } catch (e) {
                    setErroPush((e as Error).message);
                  } finally {
                    setAtivandoPush(false);
                  }
                }}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {ativandoPush ? "Ativando..." : "Ativar neste dispositivo"}
              </button>
            )}
            {statusPush === "denied" && (
              <p className="mt-2 text-amber-600">
                As notificações estão bloqueadas pro site nas configurações do
                seu navegador/Android — procure "Permissões do site" ou
                "Notificações" nas configurações do Chrome pra esse site e
                libere, depois volte aqui.
              </p>
            )}
            {erroPush && <p className="mt-2 text-red-600">{erroPush}</p>}
            {sucessoPush && <p className="mt-2 text-emerald-600">{sucessoPush}</p>}
          </div>
        )}

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
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
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
