-- Assistente JW — schema inicial
-- Mapeado a partir das tabelas Drift do app Flutter original
-- (configuracoes, designacoes, estudantes, reunioes, pdfs_recebidos,
-- historico_envios), adaptado para Postgres/Supabase.
--
-- Todas as tabelas usam RLS (Row Level Security) com uma coluna
-- user_id, já que o Supabase é multi-tenant por padrão (auth.uid()).
-- Isso também permite, no futuro, mais de uma congregação/usuário
-- usando a mesma instância sem misturar dados.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------
-- configuracoes (1 linha por usuário/congregação)
-- ---------------------------------------------------------------
create table configuracoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  congregacao text not null default '',
  circuito text not null default '',
  idioma text not null default 'pt_BR',
  tema text not null default 'system' check (tema in ('system', 'light', 'dark')),

  notificacoes boolean not null default true,
  importar_automaticamente boolean not null default true,
  monitorar_compartilhamentos boolean not null default true,
  enviar_whatsapp_automaticamente boolean not null default false,
  confirmar_antes_enviar boolean not null default true,
  salvar_historico boolean not null default true,
  backup_automatico boolean not null default true,
  pasta_backup text not null default '',

  telefone_padrao text not null default '',
  mensagem_padrao text not null default
    'Olá! Segue em anexo sua designação desta semana. Tenha uma excelente reunião!',

  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  unique (user_id)
);

-- ---------------------------------------------------------------
-- estudantes
-- ---------------------------------------------------------------
create table estudantes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  nome text not null default '',
  nome_pesquisa text not null default '', -- versão normalizada p/ busca
  telefone text not null default '',
  email text not null default '',
  endereco text not null default '',
  observacoes text not null default '',

  ativo boolean not null default true,
  recebe_whatsapp boolean not null default true,
  recebe_email boolean not null default false,
  contato_id text not null default '',

  ultimo_envio timestamptz,

  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index idx_estudantes_user on estudantes(user_id);
create index idx_estudantes_nome_pesquisa on estudantes(user_id, nome_pesquisa);

-- ---------------------------------------------------------------
-- reunioes
-- ---------------------------------------------------------------
create table reunioes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  data date not null,
  semana text not null default '',
  tema text not null default 'Reunião Vida e Ministério Cristão',
  presidente text not null default '',
  leitor text not null default '',
  oracao_inicial text not null default '',
  oracao_final text not null default '',

  importada boolean not null default false,

  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index idx_reunioes_user_data on reunioes(user_id, data);

-- ---------------------------------------------------------------
-- designacoes
-- ---------------------------------------------------------------
create table designacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reuniao_id uuid references reunioes(id) on delete set null,

  codigo text not null default '',
  nome text not null default '',
  tipo text not null default '', -- Presidente, Leitor, Tesouros, Joias, Discurso...
  estudante text not null default '',
  ajudante text not null default '',

  data_reuniao date not null,
  semana text not null default '',
  sala text not null default 'Principal',
  observacoes text not null default '',

  concluida boolean not null default false,
  pdf_enviado boolean not null default false,
  whatsapp_enviado boolean not null default false,

  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index idx_designacoes_user_data on designacoes(user_id, data_reuniao);
create index idx_designacoes_estudante on designacoes(user_id, estudante);

-- ---------------------------------------------------------------
-- pdfs_recebidos
-- ---------------------------------------------------------------
create table pdfs_recebidos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  nome_arquivo text not null default '',
  -- caminho no Supabase Storage (bucket "pdfs"), não caminho local
  caminho_arquivo text not null default '',

  estudante text not null default '',
  telefone text not null default '',

  processado boolean not null default false,
  enviado_whatsapp boolean not null default false,

  recebido_em timestamptz not null default now()
);

create index idx_pdfs_recebidos_user on pdfs_recebidos(user_id);

-- ---------------------------------------------------------------
-- historico_envios
-- ---------------------------------------------------------------
create table historico_envios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  pdf_id uuid references pdfs_recebidos(id) on delete set null,
  estudante_id uuid references estudantes(id) on delete set null,

  estudante text not null default '',
  telefone text not null default '',
  mensagem text not null default '',

  sucesso boolean not null default false,
  erro text not null default '',

  enviado_em timestamptz not null default now()
);

create index idx_historico_user_data on historico_envios(user_id, enviado_em desc);

-- ---------------------------------------------------------------
-- Row Level Security — cada usuário só vê/edita seus próprios dados
-- ---------------------------------------------------------------
alter table configuracoes enable row level security;
alter table estudantes enable row level security;
alter table reunioes enable row level security;
alter table designacoes enable row level security;
alter table pdfs_recebidos enable row level security;
alter table historico_envios enable row level security;

create policy "own rows" on configuracoes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows" on estudantes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows" on reunioes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows" on designacoes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows" on pdfs_recebidos for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows" on historico_envios for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- Trigger genérico para manter atualizado_em em dia
-- ---------------------------------------------------------------
create or replace function set_atualizado_em()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_configuracoes_atualizado_em before update on configuracoes
  for each row execute function set_atualizado_em();
create trigger trg_estudantes_atualizado_em before update on estudantes
  for each row execute function set_atualizado_em();
create trigger trg_reunioes_atualizado_em before update on reunioes
  for each row execute function set_atualizado_em();
create trigger trg_designacoes_atualizado_em before update on designacoes
  for each row execute function set_atualizado_em();
