import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
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
        start_url: "/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
        ],
        // Web Share Target: permite o Android/Chrome oferecer o app como
        // destino ao "compartilhar" um PDF de outro app — substitui o
        // ShareReceiverScreen do app Flutter original.
        share_target: {
          action: "/share-target",
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
