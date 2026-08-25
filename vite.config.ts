import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages de projeto (não é um site de usuário/organização) serve
// tudo sob um subcaminho, ex: https://<usuario>.github.io/assistentejw/
// — não na raiz do domínio. Isso precisa refletir em vários lugares:
// os assets (Vite cuida disso via "base"), o manifest do PWA
// (start_url/scope), o registro do Web Share Target e os caminhos
// absolutos usados dentro do service worker (src/sw.ts).
//
// Rodando localmente (npm run dev / npm run preview) o Vite também usa
// esse mesmo "base", então os testes locais continuam batendo com o
// que vai pro ar.
const BASE = "/assistentejw/";

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      // injectManifest (em vez de generateSW): precisamos de um service
      // worker com lógica própria para interceptar o POST do Web Share
      // Target (ver src/sw.ts). O generateSW só sabe gerar cache de
      // assets estáticos, sem espaço para fetch handlers customizados.
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },
      manifest: {
        name: "Assistente JW",
        short_name: "Assistente JW",
        description: "Assistente de designações para reunião semanal",
        theme_color: "#4f46e5",
        background_color: "#ffffff",
        display: "standalone",
        start_url: BASE,
        scope: BASE,
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
        ],
        // Web Share Target: permite o Android/Chrome oferecer o app como
        // destino ao "compartilhar" um PDF de outro app — substitui o
        // ShareReceiverScreen do app Flutter original.
        share_target: {
          action: `${BASE}share-target`,
          method: "POST",
          enctype: "multipart/form-data",
          params: {
            title: "title",
            text: "text",
            files: [{ name: "arquivos", accept: ["application/pdf", ".pdf"] }],
          },
        },
      },
    }),
  ],
});
