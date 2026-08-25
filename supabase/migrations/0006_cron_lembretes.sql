-- Agenda a Edge Function send-lembretes para rodar todo dia às 18:00 UTC
-- (ajuste a hora conforme seu fuso — 18:00 UTC = 15:00 em Brasília,
-- horário padrão sem DST).
--
-- Precisa das extensões pg_cron e pg_net habilitadas no projeto
-- (Dashboard > Database > Extensions, ou rode os "create extension"
-- abaixo se sua conta tiver permissão).
--
-- SUBSTITUA os dois placeholders abaixo antes de rodar:
--   SEU-PROJETO           -> a referência do seu projeto Supabase
--                             (Project Settings > General > Reference ID)
--   SUA-SERVICE-ROLE-KEY  -> Project Settings > API > service_role key
-- Essas duas informações NÃO ficam em nenhum arquivo do repositório —
-- só existem aqui, no SQL que você roda uma vez no seu próprio projeto.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'lembretes-designacoes-diario',
  '0 18 * * *', -- todo dia às 18:00 UTC
  $$
  select net.http_post(
    url := 'https://SEU-PROJETO.supabase.co/functions/v1/send-lembretes',
    headers := jsonb_build_object(
      'Authorization', 'Bearer SUA-SERVICE-ROLE-KEY',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Para conferir os agendamentos ativos:
--   select * from cron.job;
-- Para remover este agendamento no futuro:
--   select cron.unschedule('lembretes-designacoes-diario');
