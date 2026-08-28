-- Confirmação por link: cada designação ganha um token único e
-- imprevisível (não é o mesmo que o "id", embora ambos sejam uuid —
-- token_confirmacao é o que vai na URL pública, então trocá-lo não
-- expõe nem afeta o id interno usado no resto do app). O estudante
-- recebe um link tipo /confirmar/<token> no WhatsApp, sem precisar de
-- login, e confirma ou recusa (podendo indicar um substituto).
--
-- O acesso a esse token é feito só pela Edge Function "confirmar"
-- (service role, bypassa RLS) — o app nunca expõe a tabela inteira
-- para usuários anônimos.

alter table designacoes
  add column token_confirmacao uuid not null default gen_random_uuid(),
  add column confirmacao_status text not null default 'pendente', -- pendente | confirmado | recusado
  add column confirmado_em timestamptz,
  add column substituto_sugerido text not null default '';

create unique index idx_designacoes_token_confirmacao on designacoes(token_confirmacao);

comment on column designacoes.token_confirmacao is
  'Token público usado no link de confirmação enviado por WhatsApp — não é o id interno.';
comment on column designacoes.confirmacao_status is
  'pendente | confirmado | recusado — preenchido pela pessoa via link público, através da Edge Function confirmar.';
