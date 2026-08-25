// Edge Function: send-lembretes
//
// Roda uma vez por dia (via cron — ver README.md, seção "Notificações
// push") e, para cada usuário com notificações ativadas que tenha uma
// reunião em breve com designações ainda não enviadas pelo WhatsApp,
// manda um push lembrando de enviar.
//
// Não manda push pros ESTUDANTES (eles não são usuários do app, só
// recebem WhatsApp) — manda pro DONO da congregação/conta, que é quem
// de fato precisa lembrar de disparar os envios.
//
// Variáveis de ambiente esperadas (ver README):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  -> injetadas automaticamente
//                                                pelo Supabase, não precisa
//                                                configurar como secret
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY,
//   VAPID_SUBJECT                            -> secrets, configurar com
//                                                `supabase secrets set`
//   DIAS_ANTECEDENCIA (opcional, padrão "1")  -> quantos dias antes da
//                                                reunião o lembrete sai

import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:contato@example.com";
const DIAS_ANTECEDENCIA = Number(Deno.env.get("DIAS_ANTECEDENCIA") ?? "1");

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function dataAlvoISO(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + DIAS_ANTECEDENCIA);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

Deno.serve(async (req: Request) => {
  // Protege a função: só aceita chamadas autenticadas com a service
  // role key (é isso que o cron/pg_cron vai enviar como Bearer).
  const auth = req.headers.get("Authorization") ?? "";
  if (auth !== `Bearer ${SERVICE_ROLE_KEY}`) {
    return new Response("unauthorized", { status: 401 });
  }

  const alvo = dataAlvoISO();

  const { data: reunioes, error: erroReunioes } = await supabase
    .from("reunioes")
    .select("id, user_id, data, semana, tema")
    .eq("data", alvo);

  if (erroReunioes) {
    return new Response(JSON.stringify({ error: erroReunioes.message }), {
      status: 500,
    });
  }

  let enviados = 0;
  let falhas = 0;

  for (const reuniao of reunioes ?? []) {
    // configurações do usuário: respeita o toggle de notificações
    const { data: config } = await supabase
      .from("configuracoes")
      .select("notificacoes")
      .eq("user_id", reuniao.user_id)
      .maybeSingle();

    if (config && config.notificacoes === false) continue;

    const { data: pendentes } = await supabase
      .from("designacoes")
      .select("id, tipo, estudante")
      .eq("reuniao_id", reuniao.id)
      .eq("whatsapp_enviado", false);

    if (!pendentes || pendentes.length === 0) continue;

    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", reuniao.user_id);

    if (!subs || subs.length === 0) continue;

    const titulo = `Reunião ${DIAS_ANTECEDENCIA === 1 ? "amanhã" : `em ${DIAS_ANTECEDENCIA} dias`}`;
    const corpo =
      pendentes.length === 1
        ? `1 designação ainda não foi enviada (${pendentes[0].tipo || pendentes[0].estudante}).`
        : `${pendentes.length} designações ainda não foram enviadas.`;

    const payload = JSON.stringify({
      title: titulo,
      body: corpo,
      // GitHub Pages de projeto serve o app sob /assistentejw/, não na
      // raiz — precisa bater com o "base" configurado em vite.config.ts.
      url: "/assistentejw/designacoes",
    });

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        );
        enviados++;
      } catch (err) {
        falhas++;
        // 404/410 = subscription expirada/revogada no navegador -> limpa
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        } else {
          console.error("Falha ao enviar push:", err);
        }
      }
    }
  }

  return new Response(JSON.stringify({ enviados, falhas }), {
    headers: { "Content-Type": "application/json" },
  });
});
