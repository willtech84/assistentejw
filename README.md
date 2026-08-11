# Assistente JW

Assistente de designações para reunião semanal das Testemunhas de Jeová.

PWA construído com **React + TypeScript + Vite + Supabase**, hospedável no
Cloudflare Pages — mesmo padrão dos outros apps do projeto (Território,
SuperVenda, Plantão).

> Este app começou como um projeto Flutter e foi reescrito para este stack.
> A versão Flutter (histórico anterior neste mesmo repositório) tinha uma
> estrutura de arquivos corrompida e nenhuma tela com lógica de negócio
> implementada de fato — era, na prática, apenas um esqueleto.

## Stack

- React 19 + TypeScript + Vite 8
- Supabase (Postgres + Auth + Storage), com Row Level Security
- Tailwind CSS 4
- vite-plugin-pwa (instalável, com Web Share Target para receber PDFs)
- SheetJS (xlsx) para importação de planilhas — carregado sob demanda

## Rodando localmente

1. Crie um projeto em [supabase.com](https://supabase.com) (ou use um que já
   tenha).
2. No SQL Editor do painel do Supabase, rode nesta ordem:
   - `supabase/migrations/0001_initial_schema.sql`
   - `supabase/migrations/0002_storage_pdfs.sql`
3. Copie `.env.example` para `.env.local` e preencha com a URL e a
   `anon key` do seu projeto (Project Settings → API).
4. Instale as dependências e rode:

   ```bash
   npm install
   npm run dev
   ```

5. Abra o app, cadastre-se (email + senha) e comece a usar.

## Build de produção

```bash
npm run build   # gera dist/, roda tsc -b antes
npm run preview # serve o build localmente para conferir
```

Para hospedar no Cloudflare Pages: build command `npm run build`, diretório
de saída `dist`, e configure `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
como variáveis de ambiente do projeto no painel do Cloudflare.

## O que já funciona

- Autenticação (email/senha via Supabase Auth)
- CRUD de estudantes, designações e reuniões/agenda
- Configurações da congregação (mensagem padrão, preferências)
- Importação de designações via planilha Excel (colunas: Data, Tipo,
  Estudante, Ajudante, Sala, Semana)
- Upload de PDFs para o Supabase Storage
- Envio de designação via WhatsApp usando links `wa.me` (abre o WhatsApp
  com a mensagem pronta — o envio em si é manual, um clique)
- Histórico de envios
- PWA instalável, com Web Share Target configurado (para receber PDF
  compartilhado de outro app no Android/Chrome)

## O que ainda é próximo passo (não implementado)

- **Extração de texto de PDF** (identificar automaticamente estudante/tipo
  de designação a partir de um PDF recebido) — o app Flutter original nunca
  chegou a implementar isso de verdade (`pdf_text_service.dart`,
  `processador_pdf_service.dart` eram stubs). Ficou de fora por enquanto;
  se quiser, dá pra adicionar com `pdfjs-dist` no client ou uma Supabase
  Edge Function.
- **Notificações push de verdade** (hoje não há lembrete automático antes da
  reunião) — precisa de VAPID keys + service worker de push.
- **Envio automático de WhatsApp** — exigiria a API oficial do WhatsApp
  Business (credenciais e aprovação da Meta). O que existe hoje é o
  fluxo manual via `wa.me`.
