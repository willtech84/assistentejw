/// <reference lib="webworker" />

// Service worker customizado (modo injectManifest do vite-plugin-pwa).
// Precisou substituir o modo generateSW porque o Web Share Target exige
// interceptar requisições POST — o modo generateSW (usado antes) só
// gera cache de assets estáticos e não permite lógica customizada de
// fetch.
//
// Fluxo do Web Share Target (declarado em vite.config.ts):
//   1. Usuário compartilha um PDF de outro app (ex: Android) para o
//      Assistente JW instalado.
//   2. O SO faz um POST multipart/form-data para "/share-target".
//   3. Esse POST nunca chega a um servidor de verdade — é interceptado
//      aqui, no fetch handler abaixo, porque o app é uma SPA estática.
//   4. Guardamos o arquivo recebido na Cache Storage (a única forma de
//      persistir um Blob grande e acessível pela aba que vai abrir a
//      seguir) e redirecionamos (303) para "/pdfs?compartilhado=1".
//   5. A tela de PDFs (src/pages/Pdfs.tsx), ao detectar esse parâmetro
//      na URL, busca o arquivo em src/services/shareTarget.ts e segue
//      o mesmo fluxo de upload+extração usado para upload manual.
//
// Limitação conhecida: isso só funciona quando o service worker já
// está ativo (app já foi aberto/instalado ao menos uma vez antes do
// primeiro compartilhamento) — é o caso normal de uso de um PWA
// instalado, mas vale deixar registrado.

import { precacheAndRoute } from "workbox-precaching";

declare let self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

const CACHE_SHARE_TARGET = "assistente-jw-share-target";

// self.registration.scope já vem com o subcaminho certo (ex:
// "https://usuario.github.io/assistentejw/"), então construímos os
// caminhos a partir dele em vez de assumir que o app está na raiz do
// domínio — necessário pro GitHub Pages, que serve o projeto sob
// /assistentejw/ e não em "/".
const SCOPE_PATH = new URL(self.registration.scope).pathname;

self.addEventListener("fetch", (event: FetchEvent) => {
  const url = new URL(event.request.url);
  if (
    event.request.method === "POST" &&
    url.pathname === `${SCOPE_PATH}share-target`
  ) {
    event.respondWith(tratarCompartilhamento(event.request));
  }
});

async function tratarCompartilhamento(request: Request): Promise<Response> {
  try {
    const formData = await request.formData();
    const arquivo = formData.get("arquivos");

    if (arquivo instanceof File) {
      const cache = await caches.open(CACHE_SHARE_TARGET);
      const chave = `/__shared-pdf__/${Date.now()}_${arquivo.name}`;
      await cache.put(
        chave,
        new Response(arquivo, {
          headers: { "Content-Type": arquivo.type || "application/pdf" },
        })
      );
      await cache.put("/__shared-pdf__/ultimo", new Response(chave));
    }
  } catch (err) {
    console.error("Falha ao processar PDF compartilhado:", err);
  }

  return Response.redirect(`${SCOPE_PATH}pdfs?compartilhado=1`, 303);
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(self.clients.claim());
});

// ---------------------------------------------------------------
// Notificações push (lembrete de reunião)
//
// O payload é enviado pela Edge Function supabase/functions/send-lembretes
// como JSON: { title, body, url }. "url" é a rota do app pra abrir ao
// clicar na notificação (ex: "/designacoes").
// ---------------------------------------------------------------

self.addEventListener("push", (event: PushEvent) => {
  let dados: { title?: string; body?: string; url?: string } = {};
  try {
    dados = event.data ? event.data.json() : {};
  } catch {
    dados = { body: event.data?.text() ?? "" };
  }

  const titulo = dados.title ?? "Assistente JW";
  const opcoes: NotificationOptions = {
    body: dados.body ?? "Você tem uma designação na próxima reunião.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: dados.url ?? SCOPE_PATH },
  };

  event.waitUntil(self.registration.showNotification(titulo, opcoes));
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const url = (event.notification.data?.url as string) ?? SCOPE_PATH;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      })
  );
});
