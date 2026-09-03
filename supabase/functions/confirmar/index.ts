// Edge Function: confirmar
//
// Pública (sem verificação de JWT — deploy com --no-verify-jwt), porque
// quem acessa é o estudante clicando num link do WhatsApp, sem estar
// logado no app. Usa a service role key (nunca exposta ao navegador)
// pra ler/gravar a linha certa em designacoes, sem precisar abrir RLS
// pra usuários anônimos verem a tabela inteira.
//
// GET  ?token=...            -> devolve os dados básicos pra exibir a
//                                tela de confirmação (tipo, semana,
//                                data, estudante, status atual)
// POST { token, status,      -> grava a confirmação/recusa (e o nome
//        substituto? }           do substituto sugerido, se houver)

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, apikey, authorization, x-client-info",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  const url = new URL(req.url);

  if (req.method === "GET") {
    const token = url.searchParams.get("token") ?? "";
    if (!token) return json({ error: "token ausente" }, 400);

    const { data, error } = await supabase
      .from("designacoes")
      .select(
        "estudante, ajudante, tipo, semana, data_reuniao, sala, confirmacao_status, substituto_sugerido"
      )
      .eq("token_confirmacao", token)
      .maybeSingle();

    if (error) return json({ error: error.message }, 500);
    if (!data) return json({ error: "não encontrado" }, 404);
    return json({ designacao: data });
  }

  if (req.method === "POST") {
    let corpo: { token?: string; status?: string; substituto?: string };
    try {
      corpo = await req.json();
    } catch {
      return json({ error: "corpo inválido" }, 400);
    }

    const { token, status, substituto } = corpo;
    if (!token || (status !== "confirmado" && status !== "recusado")) {
      return json({ error: "parâmetros inválidos" }, 400);
    }

    const { data, error } = await supabase
      .from("designacoes")
      .update({
        confirmacao_status: status,
        confirmado_em: new Date().toISOString(),
        substituto_sugerido: substituto?.trim() ?? "",
      })
      .eq("token_confirmacao", token)
      .select("id")
      .maybeSingle();

    if (error) return json({ error: error.message }, 500);
    if (!data) return json({ error: "não encontrado" }, 404);
    return json({ ok: true });
  }

  return json({ error: "método não suportado" }, 405);
});
