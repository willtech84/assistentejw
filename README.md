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
   - `supabase/migrations/0003_estudante_fk.sql`
   - `supabase/migrations/0004_pdf_extraction.sql`
   - `supabase/migrations/0005_push_subscriptions.sql`
   - `supabase/migrations/0006_cron_lembretes.sql` (só depois de configurar
     a Edge Function — ver seção "Notificações push" abaixo)
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

## Hospedando no GitHub Pages

Diferente dos outros apps do projeto (que usam Cloudflare Pages), este
está configurado para servir sob `https://<usuario>.github.io/assistentejw/`
— um GitHub Pages de projeto, que fica num subcaminho, não na raiz do
domínio. Isso já está refletido em `vite.config.ts` (`base`), no
`basename` do `BrowserRouter` (`src/App.tsx`) e nos caminhos do service
worker (`src/sw.ts`).

1. Preencha `.env.local` (ou `.env.production`) com
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e
   `VITE_VAPID_PUBLIC_KEY` — essas variáveis são embutidas no build no
   momento em que você roda `npm run build`/`npm run deploy`.
2. Rode:

   ```bash
   npm install   # traz a dependência gh-pages
   npm run deploy
   ```

   Isso builda o projeto e publica o conteúdo de `dist/` na branch
   `gh-pages` do repositório (o pacote `gh-pages` cuida do push).
3. No GitHub, vá em Settings → Pages e, em "Build and deployment",
   selecione Source = "Deploy from a branch", branch = `gh-pages`,
   pasta = `/ (root)`. Salve.
4. Depois de alguns minutos, o site fica em
   `https://<seu-usuário>.github.io/assistentejw/`.

Toda vez que quiser publicar uma atualização, rode `npm run deploy` de
novo. Não há CI configurado — é um comando manual, do jeito mais
simples possível.

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

## Notificações push

Lembrete diário, enviado pra você (dono da conta/congregação) — não pros
estudantes — avisando que há uma reunião próxima com designações ainda
não enviadas pelo WhatsApp. Estudantes continuam recebendo só o link
`wa.me`, como hoje.

Peças envolvidas:

- `push_subscriptions` (migration `0005`) — guarda a inscrição de Web Push
  de cada navegador/dispositivo que você ativar.
- `src/services/push.ts` + botão em Configurações — ativa/desativa a
  notificação no dispositivo atual.
- `src/sw.ts` — recebe o push e mostra a notificação.
- `supabase/functions/send-lembretes` — Edge Function (Deno) que roda uma
  vez por dia, olha as reuniões do dia seguinte com designações
  pendentes e manda o push.
- `supabase/migrations/0006_cron_lembretes.sql` — agenda essa função via
  `pg_cron` + `pg_net`.

### 1. Chaves VAPID

Um par de chaves VAPID já foi gerado para este projeto (ver mensagem em
que este pacote foi entregue). Se quiser gerar um novo par:

```bash
npx web-push generate-vapid-keys
```

Coloque a chave **pública** em `VITE_VAPID_PUBLIC_KEY` (`.env.local`, e
também como variável de ambiente no Cloudflare Pages). A chave
**privada** nunca vai no `.env` nem no repositório — só como secret da
Edge Function (próximo passo).

### 2. Deploy da Edge Function

Precisa do [Supabase CLI](https://supabase.com/docs/guides/cli) instalado
e logado (`supabase login`).

```bash
# na raiz do projeto
supabase link --project-ref SEU-PROJETO   # Project Settings > General > Reference ID

supabase secrets set \
  VAPID_PUBLIC_KEY=coleaquiapublica \
  VAPID_PRIVATE_KEY=coleaquiaprivada \
  VAPID_SUBJECT=mailto:seuemail@exemplo.com

supabase functions deploy send-lembretes
```

`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` **não** precisam ser
configuradas como secret — o Supabase já injeta essas duas
automaticamente em toda Edge Function.

Teste manual (deve responder `{"enviados":0,"falhas":0}` se não houver
reunião amanhã com pendências):

```bash
curl -X POST 'https://SEU-PROJETO.supabase.co/functions/v1/send-lembretes' \
  -H "Authorization: Bearer SUA-SERVICE-ROLE-KEY"
```

### 3. Agendar o cron

Abra `supabase/migrations/0006_cron_lembretes.sql`, substitua
`SEU-PROJETO` e `SUA-SERVICE-ROLE-KEY` pelos valores do seu projeto
(Project Settings → API) e rode o arquivo no SQL Editor do painel — só
uma vez. Por padrão roda todo dia às 18:00 UTC (15:00 em Brasília, sem
horário de verão); ajuste o `'0 18 * * *'` se quiser outro horário.

Para conferir se está agendado: `select * from cron.job;` no SQL
Editor.

### 4. Ativar no app

Depois do deploy, abra o app publicado (`https://<usuário>.github.io/assistentejw/`)
→ Configurações → "Ativar neste dispositivo", na seção de notificações.
Isso vale por navegador/aparelho — quem for testar em outro celular
precisa ativar de novo lá.

## Confirmação de designação por link (sem login)

Cada designação enviada pelo WhatsApp inclui um link
`/confirmar/<token>` — a pessoa clica, vê os dados da designação, e
toca em "Vou fazer" ou "Não vou poder" (podendo sugerir um substituto).
Não precisa estar logada no app.

Peças envolvidas:

- Migration `0008_confirmacao_designacoes.sql` — adiciona
  `token_confirmacao` (usado na URL pública, diferente do `id` interno),
  `confirmacao_status`, `confirmado_em`, `substituto_sugerido`.
- `supabase/functions/confirmar` — Edge Function pública (sem JWT) que lê
  e grava só pelo token, usando a service role key — o app nunca abre a
  tabela `designacoes` inteira pra usuários anônimos.
- `src/pages/Confirmar.tsx` — tela pública, roteada em `App.tsx` fora da
  área autenticada.
- `src/services/whatsapp.ts` (`linkConfirmacao`) — monta o link a partir
  do token e do domínio atual.
- `src/services/resumoSemanal.ts` — gera um PDF por semana com quem
  confirmou, quem não vai poder (e o substituto sugerido, se houver) e
  quem ainda não respondeu — botão "Baixar resumo de confirmações" em
  cada grupo de semana na tela de Designações.

Deploy da Edge Function (**precisa da flag `--no-verify-jwt`**, diferente
da `send-lembretes` — essa aqui é chamada por gente sem login):

```bash
supabase functions deploy confirmar --no-verify-jwt
```

E rodar a migration `0008_confirmacao_designacoes.sql` no SQL Editor do
painel, como as outras.

## O que ainda é próximo passo (não implementado)

- **Extração de texto de PDF** (identificar automaticamente estudante/tipo
  de designação a partir de um PDF recebido) — o app Flutter original nunca
  chegou a implementar isso de verdade (`pdf_text_service.dart`,
  `processador_pdf_service.dart` eram stubs). Ficou de fora por enquanto;
  se quiser, dá pra adicionar com `pdfjs-dist` no client ou uma Supabase
  Edge Function.
- **Envio automático de WhatsApp** — exigiria a API oficial do WhatsApp
  Business (credenciais e aprovação da Meta). O que existe hoje é o
  fluxo manual via `wa.me`.
