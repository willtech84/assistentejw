-- Notificações push — armazena as inscrições (subscriptions) do Web Push
-- API criadas no navegador de cada usuário. Uma pessoa pode ter mais de
-- uma inscrição (ex: celular + notebook), por isso não é 1 linha por
-- usuário como em "configuracoes".
--
-- endpoint é a chave natural de deduplicação (cada subscription do
-- navegador tem um endpoint único fornecido pelo push service do SO/
-- navegador — FCM, Mozilla, etc).

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  endpoint text not null,
  p256dh text not null,
  auth text not null,

  user_agent text not null default '',
  criado_em timestamptz not null default now(),
  ultimo_uso timestamptz not null default now(),

  unique (endpoint)
);

create index idx_push_subscriptions_user on push_subscriptions(user_id);

alter table push_subscriptions enable row level security;

create policy "own rows" on push_subscriptions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- A Edge Function de envio roda com a service role key (bypassa RLS),
-- então não precisa de policy adicional para o cron/worker.

comment on table push_subscriptions is
  'Inscrições de Web Push do navegador, usadas pela Edge Function de lembrete de reunião (supabase/functions/send-lembretes).';
