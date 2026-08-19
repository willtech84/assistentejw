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

self.addEventListener("fetch", (event: FetchEvent) => {
  const url = new URL(event.request.url);
  if (event.request.method === "POST" && url.pathname === "/share-target") {
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

  return Response.redirect("/pdfs?compartilhado=1", 303);
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(self.clients.claim());
});
