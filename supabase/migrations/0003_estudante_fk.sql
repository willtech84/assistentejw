-- Vincula designacoes e pdfs_recebidos a estudantes por FK (estudante_id)
-- em vez de casar por nome (ilike) em tempo de execução.
--
-- O campo de texto `estudante` é mantido para exibição/compatibilidade
-- (ex: nome de quem não está mais cadastrado, ou digitado manualmente),
-- mas o vínculo "de verdade" passa a ser estudante_id.

alter table designacoes
  add column estudante_id uuid references estudantes(id) on delete set null;

alter table pdfs_recebidos
  add column estudante_id uuid references estudantes(id) on delete set null;

create index idx_designacoes_estudante_id on designacoes(estudante_id);
create index idx_pdfs_recebidos_estudante_id on pdfs_recebidos(estudante_id);

-- Backfill: tenta casar designacoes.estudante existentes com um
-- estudante cadastrado do mesmo usuário, por nome (case-insensitive).
-- Só resolve quando há exatamente 1 correspondência — nomes ambíguos
-- ficam sem vínculo automático e precisam ser resolvidos manualmente
-- na tela de Designações.
update designacoes d
set estudante_id = e.id
from estudantes e
where e.user_id = d.user_id
  and lower(e.nome) = lower(d.estudante)
  and d.estudante_id is null
  and (
    select count(*) from estudantes e2
    where e2.user_id = d.user_id and lower(e2.nome) = lower(d.estudante)
  ) = 1;
