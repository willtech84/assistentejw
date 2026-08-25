// Notificações push — inscreve o navegador atual usando a Web Push API
// e salva a subscription no Supabase (tabela push_subscriptions), pra
// que a Edge Function de lembrete (supabase/functions/send-lembretes)
// consiga enviar depois.
//
// A chave pública VAPID vem de uma env var (mesmo par gerado uma única
// vez para o projeto — a privada fica só no servidor, como secret da
// Edge Function). Ver README.md, seção "Notificações push".

import { supabase } from "../lib/supabase";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as
  | string
  | undefined;

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

export function suportaPush(): boolean {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function statusPermissao(): NotificationPermission | "indisponivel" {
  if (!suportaPush()) return "indisponivel";
  return Notification.permission;
}

/**
 * Pede permissão ao usuário (se ainda não decidida), cria a subscription
 * de push no navegador e salva/atualiza no Supabase.
 */
export async function ativarNotificacoes(userId: string): Promise<void> {
  if (!suportaPush()) {
    throw new Error("Este navegador não suporta notificações push.");
  }
  if (!VAPID_PUBLIC_KEY) {
    throw new Error(
      "VITE_VAPID_PUBLIC_KEY não configurada — veja o README (Notificações push)."
    );
  }

  const permissao = await Notification.requestPermission();
  if (permissao !== "granted") {
    throw new Error("Permissão de notificações negada.");
  }

  const registration = await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const json = subscription.toJSON();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: json.endpoint!,
      p256dh: json.keys!.p256dh,
      auth: json.keys!.auth,
      user_agent: navigator.userAgent,
      ultimo_uso: new Date().toISOString(),
    },
    { onConflict: "endpoint" }
  );

  if (error) throw error;
}

/**
 * Cancela a subscription no navegador e remove do Supabase.
 */
export async function desativarNotificacoes(): Promise<void> {
  if (!suportaPush()) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
}
