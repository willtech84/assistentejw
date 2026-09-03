// Página pública de confirmação — SEM login. Acessada pelo link que
// vai na mensagem de WhatsApp (/confirmar/<token>). Fala só com a
// Edge Function "confirmar" (nunca com a tabela designacoes
// diretamente), então não precisa nem importa o cliente Supabase
// autenticado aqui.
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/confirmar`;

// O gateway do Supabase (sistema novo de chaves "publishable"/"secret")
// exige uma apikey em toda chamada — mesmo pra Edge Functions públicas
// com verificação de JWT desligada. A chave pública (mesma usada pelo
// resto do app) é segura de embutir no front-end.
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const HEADERS_BASE = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };

interface DadosDesignacao {
  estudante: string;
  ajudante: string;
  tipo: string;
  semana: string;
  data_reuniao: string;
  sala: string;
  confirmacao_status: string;
  substituto_sugerido: string;
}

export default function Confirmar() {
  const { token } = useParams<{ token: string }>();
  const [dados, setDados] = useState<DadosDesignacao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mostrarCampoSubstituto, setMostrarCampoSubstituto] = useState(false);
  const [substituto, setSubstituto] = useState("");
  const [concluido, setConcluido] = useState<"confirmado" | "recusado" | null>(
    null
  );

  useEffect(() => {
    if (!token) return;
    fetch(`${FUNCTIONS_URL}?token=${encodeURIComponent(token)}`, {
      headers: HEADERS_BASE,
    })
      .then(async (r) => {
        if (!r.ok) {
          const texto = await r.text().catch(() => "");
          throw new Error(`HTTP ${r.status}${texto ? `: ${texto.slice(0, 200)}` : ""}`);
        }
        return r.json();
      })
      .then((json) => {
        if (json.error) {
          setErro(
            json.error === "não encontrado"
              ? "Link inválido ou expirado."
              : `Não foi possível carregar essa designação (${json.error}).`
          );
        } else {
          setDados(json.designacao);
          if (json.designacao.confirmacao_status !== "pendente") {
            setConcluido(json.designacao.confirmacao_status);
          }
        }
      })
      .catch((e) =>
        setErro(
          `Não foi possível conectar ao servidor de confirmação. Detalhe técnico: ${
            (e as Error).message
          }`
        )
      )
      .finally(() => setCarregando(false));
  }, [token]);

  async function responder(status: "confirmado" | "recusado") {
    if (status === "recusado" && !mostrarCampoSubstituto) {
      setMostrarCampoSubstituto(true);
      return;
    }
    setEnviando(true);
    try {
      const r = await fetch(FUNCTIONS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...HEADERS_BASE },
        body: JSON.stringify({ token, status, substituto }),
      });
      if (!r.ok) {
        const texto = await r.text().catch(() => "");
        throw new Error(`HTTP ${r.status}${texto ? `: ${texto.slice(0, 200)}` : ""}`);
      }
      const json = await r.json();
      if (json.error) {
        setErro(`Não foi possível registrar sua resposta (${json.error}).`);
      } else {
        setConcluido(status);
      }
    } catch (e) {
      setErro(
        `Não foi possível conectar ao servidor de confirmação. Detalhe técnico: ${
          (e as Error).message
        }`
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-lg font-semibold text-slate-900">
          Confirmação de designação
        </h1>

        {carregando && <p className="text-sm text-slate-500">Carregando...</p>}

        {!carregando && erro && (
          <p className="text-sm text-red-600">{erro}</p>
        )}

        {!carregando && !erro && dados && !concluido && (
          <>
            <div className="mb-5 space-y-1 text-sm">
              <p>
                <span className="text-slate-500">Estudante:</span>{" "}
                <span className="font-medium text-slate-900">
                  {dados.estudante}
                </span>
              </p>
              {dados.ajudante && (
                <p>
                  <span className="text-slate-500">Ajudante:</span>{" "}
                  <span className="font-medium text-slate-900">
                    {dados.ajudante}
                  </span>
                </p>
              )}
              <p>
                <span className="text-slate-500">Designação:</span>{" "}
                <span className="font-medium text-slate-900">
                  {dados.tipo}
                </span>
              </p>
              <p>
                <span className="text-slate-500">Semana:</span>{" "}
                <span className="font-medium text-slate-900">
                  {dados.semana}
                </span>
              </p>
              <p>
                <span className="text-slate-500">Local:</span>{" "}
                <span className="font-medium text-slate-900">
                  {dados.sala === "Principal" ? "Salão principal" : `Sala ${dados.sala}`}
                </span>
              </p>
            </div>

            {mostrarCampoSubstituto && (
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Sabe quem pode te substituir? (opcional)
                </label>
                <input
                  value={substituto}
                  onChange={(e) => setSubstituto(e.target.value)}
                  placeholder="Nome do substituto"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            )}

            <div className="flex gap-2">
              <button
                disabled={enviando}
                onClick={() => responder("confirmado")}
                className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                ✅ Vou fazer
              </button>
              <button
                disabled={enviando}
                onClick={() => responder("recusado")}
                className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {mostrarCampoSubstituto ? "Confirmar que não posso" : "❌ Não vou poder"}
              </button>
            </div>
          </>
        )}

        {concluido === "confirmado" && (
          <p className="text-sm text-emerald-700">
            ✅ Obrigado! Sua confirmação foi registrada.
          </p>
        )}
        {concluido === "recusado" && (
          <p className="text-sm text-red-700">
            Registrado — obrigado por avisar com antecedência.
          </p>
        )}
      </div>
    </div>
  );
}
