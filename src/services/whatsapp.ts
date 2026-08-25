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

/**
 * Envia a mensagem já preenchida no WhatsApp COM o PDF anexado, na
 * medida do que o navegador permite:
 *
 * - Onde existe Web Share API com suporte a arquivos (a grande maioria
 *   dos celulares Android/iOS): abre a folha de compartilhamento
 *   nativa já com o PDF e o texto prontos — a pessoa só toca em
 *   WhatsApp na lista e o anexo vai junto. Isso É um anexo automático
 *   de verdade.
 * - Onde não existe (a maioria dos navegadores de computador): não tem
 *   como um site anexar arquivo num chat do WhatsApp Web sozinho — é
 *   bloqueado por segurança do navegador. Nesse caso baixamos o PDF
 *   automaticamente e abrimos o WhatsApp com a mensagem pronta; a
 *   pessoa arrasta o arquivo baixado pro chat que abriu.
 *
 * Devolve "compartilhado" | "baixado" pra a tela mostrar a instrução
 * certa pro que de fato aconteceu.
 */
export async function enviarComAnexo(
  telefone: string,
  mensagem: string,
  pdfBytes: Uint8Array,
  nomeArquivo: string
): Promise<"compartilhado" | "baixado"> {
  const arquivo = new File([new Uint8Array(pdfBytes)], nomeArquivo, {
    type: "application/pdf",
  });

  if (
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [arquivo] })
  ) {
    try {
      await navigator.share({ files: [arquivo], text: mensagem });
      return "compartilhado";
    } catch (err) {
      // Usuário cancelou a folha de compartilhamento — não é erro real,
      // mas também não teve envio, então recai no fluxo de download.
      if ((err as Error)?.name === "AbortError") {
        throw err;
      }
    }
  }

  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(url);

  abrirWhatsapp(telefone, mensagem);
  return "baixado";
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
