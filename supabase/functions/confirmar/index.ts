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
//        substituto? }           do substituto sugerido, se houver) —
//                                e manda um push pro dono da
//                                designação avisando na hora, usando
//                                os mesmos secrets VAPID já
//                                configurados pra send-lembretes
//                                (secrets são por projeto, não por
//                                função, então já estão disponíveis
//                                aqui sem precisar configurar de novo)

import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:contato@example.com";
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

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

async function avisarDono(
  userId: string,
  titulo: string,
  corpo: string
): Promise<void> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return; // secrets não configurados — não quebra a confirmação por isso
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  for (const sub of subs ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title: titulo, body: corpo, url: "/designacoes" })
      );
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await supabase.from("push_subscriptions").delete().eq("id", sub.id);
      }
      // outros erros de push não devem derrubar a resposta da confirmação
    }
  }
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
      .select("id, user_id, estudante, tipo, substituto_sugerido")
      .maybeSingle();

    if (error) return json({ error: error.message }, 500);
    if (!data) return json({ error: "não encontrado" }, 404);

    const titulo = status === "confirmado" ? "Designação confirmada" : "Designação recusada";
    const corpoMsg =
      status === "confirmado"
        ? `${data.estudante} confirmou: ${data.tipo}`
        : `${data.estudante} não vai poder: ${data.tipo}` +
          (data.substituto_sugerido ? ` (sugeriu: ${data.substituto_sugerido})` : "");
    // Espera o push terminar (é rápido) pra garantir que ele realmente
    // sai antes da função encerrar — mas erro no push nunca derruba a
    // resposta da confirmação pro estudante.
    await avisarDono(data.user_id, titulo, corpoMsg).catch(() => {});

    return json({ ok: true });
  }

  return json({ error: "método não suportado" }, 405);
});
