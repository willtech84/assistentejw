// Envio via WhatsApp usando deep links wa.me.
//
// Importante: isso NÃO é envio automático. Não há uma API oficial do
// WhatsApp Business configurada (exigiria credenciais e aprovação da
// Meta), então cada "envio" abre o WhatsApp Web/App com a mensagem já
// preenchida, e a pessoa dá o "Enviar" manualmente — mesmo espírito do
// FilaEnvioService original, mas sem automação de background (que só
// é possível com API oficial ou um servidor rodando WhatsApp Web
// via biblioteca não-oficial, o que viola os termos de uso do
// WhatsApp e não deve ser usado em produção).

export function limparTelefone(telefone: string): string {
  // remove tudo que não é dígito; assume que o telefone já vem com DDI
  // (ex: 55 11 91234-5678 -> 5511912345678). Se não tiver DDI, assume Brasil.
  const digitos = telefone.replace(/\D/g, "");
  if (digitos.length <= 11) return `55${digitos}`;
  return digitos;
}

export function montarLinkWhatsapp(telefone: string, mensagem: string): string {
  const numero = limparTelefone(telefone);
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}

export function abrirWhatsapp(telefone: string, mensagem: string) {
  window.open(montarLinkWhatsapp(telefone, mensagem), "_blank");
}

export function montarMensagemDesignacao(params: {
  mensagemPadrao: string;
  nomeEstudante: string;
  tipo: string;
  semana: string;
}): string {
  const { mensagemPadrao, nomeEstudante, tipo, semana } = params;
  return (
    `Olá, ${nomeEstudante}!\n\n` +
    `${mensagemPadrao}\n\n` +
    `Designação: ${tipo}\n` +
    `Semana: ${semana}`
  );
}
