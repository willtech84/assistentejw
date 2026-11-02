-- Mensagens passam a informar só a data em que a parte será feita
-- ({data}, dd/mm/aaaa) em vez de "semana de ... até ...".
-- O app também converte "na semana {semana}" em tempo de envio, então
-- esta migration só deixa os textos salvos coerentes com a tela.
update public.configuracoes
set
  mensagem_designacao_outras = replace(mensagem_designacao_outras, 'na semana {semana}', 'no dia {data}'),
  mensagem_confirmacao_outras = replace(mensagem_confirmacao_outras, 'na semana {semana}', 'no dia {data}'),
  mensagem_padrao = replace(mensagem_padrao, 'Segue em anexo sua designação desta semana.', 'Segue sua designação.');
