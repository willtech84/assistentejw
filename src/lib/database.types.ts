// Tipos manuais espelhando supabase/migrations/0001_initial_schema.sql
//
// Quando o Supabase CLI estiver disponível localmente, isso pode ser
// substituído por tipos gerados automaticamente via:
//   supabase gen types typescript --project-id <id> > src/lib/database.types.ts

export type Configuracoes = {
  id: string;
  user_id: string;
  congregacao: string;
  circuito: string;
  idioma: string;
  tema: "system" | "light" | "dark";
  notificacoes: boolean;
  importar_automaticamente: boolean;
  monitorar_compartilhamentos: boolean;
  enviar_whatsapp_automaticamente: boolean;
  confirmar_antes_enviar: boolean;
  salvar_historico: boolean;
  backup_automatico: boolean;
  pasta_backup: string;
  telefone_padrao: string;
  mensagem_padrao: string;
  criado_em: string;
  atualizado_em: string;
}

export type Estudante = {
  id: string;
  user_id: string;
  nome: string;
  nome_pesquisa: string;
  telefone: string;
  email: string;
  endereco: string;
  observacoes: string;
  ativo: boolean;
  recebe_whatsapp: boolean;
  recebe_email: boolean;
  contato_id: string;
  ultimo_envio: string | null;
  criado_em: string;
  atualizado_em: string;
}

export type Reuniao = {
  id: string;
  user_id: string;
  data: string; // YYYY-MM-DD
  semana: string;
  tema: string;
  presidente: string;
  leitor: string;
  oracao_inicial: string;
  oracao_final: string;
  importada: boolean;
  criado_em: string;
  atualizado_em: string;
}

export type Designacao = {
  id: string;
  user_id: string;
  reuniao_id: string | null;
  codigo: string;
  nome: string;
  tipo: string;
  estudante: string;
  ajudante: string;
  data_reuniao: string; // YYYY-MM-DD
  semana: string;
  sala: string;
  observacoes: string;
  concluida: boolean;
  pdf_enviado: boolean;
  whatsapp_enviado: boolean;
  criado_em: string;
  atualizado_em: string;
}

export type PdfRecebido = {
  id: string;
  user_id: string;
  nome_arquivo: string;
  caminho_arquivo: string;
  estudante: string;
  telefone: string;
  processado: boolean;
  enviado_whatsapp: boolean;
  recebido_em: string;
}

export type HistoricoEnvio = {
  id: string;
  user_id: string;
  pdf_id: string | null;
  estudante_id: string | null;
  estudante: string;
  telefone: string;
  mensagem: string;
  sucesso: boolean;
  erro: string;
  enviado_em: string;
}

// Shape mínimo para satisfazer o generic do supabase-js (GenericSchema)
// sem depender de codegen. Cada tabela é tratada como Row = Insert =
// Update por simplicidade (os campos com default cobrem os casos de
// insert parcial na prática).
//
// Quando o Supabase CLI estiver disponível localmente, isso pode ser
// substituído por tipos gerados automaticamente via:
//   supabase gen types typescript --project-id <id> > src/lib/database.types.ts
type Tables<T> = {
  Row: T;
  Insert: Partial<T>;
  Update: Partial<T>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      configuracoes: Tables<Configuracoes>;
      estudantes: Tables<Estudante>;
      reunioes: Tables<Reuniao>;
      designacoes: Tables<Designacao>;
      pdfs_recebidos: Tables<PdfRecebido>;
      historico_envios: Tables<HistoricoEnvio>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
