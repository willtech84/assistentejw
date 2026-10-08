-- Duas mensagens novas pra partes que NÃO são de estudante (Presidente,
-- Oração, Dirigentes de sala, Estudo Bíblico de Congregação, discursos)
-- — essas nunca usam o S-89, e têm 2 momentos de envio distintos:
-- o aviso inicial da designação, e depois um lembrete separado pra
-- confirmar presença na semana.
--
-- mensagem_padrao (já existente) continua servindo pras partes DE
-- estudante, tanto com quanto sem o S-89 anexado — não precisou de
-- campo novo pra esse caso.

alter table configuracoes
  add column mensagem_designacao_outras text not null default
    'Olá! Você foi designado(a) para: {tipo}, na semana {semana}.',
  add column mensagem_confirmacao_outras text not null default
    'Olá! Lembrete da sua designação ({tipo}) na semana {semana}. Por favor confirme sua participação.';
