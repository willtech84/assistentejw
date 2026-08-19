-- Suporte à extração de texto de PDF (client-side, via pdfjs-dist).
--
-- texto_extraido guarda o texto bruto extraído do PDF, útil para
-- conferência manual e para permitir buscar/reprocessar depois sem
-- reabrir o arquivo. tipo_detectado guarda o tipo de designação que a
-- heurística sugeriu (pode ser diferente do que o usuário confirmou).

alter table pdfs_recebidos
  add column texto_extraido text,
  add column tipo_detectado text not null default '';
