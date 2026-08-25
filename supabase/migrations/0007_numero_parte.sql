-- Número da parte (ex: "3", "5") como aparece no roteiro da reunião —
-- necessário para preencher o campo "Número da parte" do formulário
-- S-89 (Designação para a Reunião). Não existia antes porque nada no
-- app usava esse dado até a geração automática do S-89.

alter table designacoes
  add column numero_parte text not null default '';
