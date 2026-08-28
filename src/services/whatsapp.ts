// Envio via WhatsApp usando deep links.
//
// Importante: isso NÃO é envio automático. Não há uma API oficial do
// WhatsApp Business configurada (exigiria credenciais e aprovação da
// Meta), então cada "envio" abre o WhatsApp Web/App com a mensagem já
// preenchida, e a pessoa dá o "Enviar" manualmente.
//
// Duas formas de deep link, cada uma com uma limitação diferente — não
// existe opção que resolva as duas coisas ao mesmo tempo, é uma
// limitação da própria plataforma (não do código):
//
// 1) Link direto (api.whatsapp.com/send?phone=...): abre o WhatsApp JÁ
//    na conversa do contato certo. NÃO consegue anexar arquivo — só
//    preenche texto.
// 2) Web Share API (navigator.share com arquivo): consegue anexar o
//    PDF automaticamente, mas quem escolhe o destino é a folha de
//    compartilhamento nativa do Android/iOS — ela não recebe qual
//    contato abrir, só a lista de apps. A pessoa que está enviando
//    escolhe o contato manualmente depois que o WhatsApp abre.
//
// Por isso o app deixa escolher: anexar o S-89 (opção 2, mais lenta
// pra achar o contato) ou não anexar (opção 1, vai direto no contato
// certo).

function limparTelefone(telefone: string): string {
  // remove tudo que não é dígito; assume que o telefone já vem com DDI
  // (ex: 55 11 91234-5678 -> 5511912345678). Se não tiver DDI, assume Brasil.
  const digitos = telefone.replace(/\D/g, "");
  if (digitos.length <= 11) return `55${digitos}`;
  return digitos;
}

export function montarLinkWhatsapp(telefone: string, mensagem: string): string {
  const numero = limparTelefone(telefone);
  // api.whatsapp.com (em vez de wa.me) é mais confiável abrindo direto
  // na conversa do contato certo quando chamado de dentro de um PWA/
  // navegador mobile — wa.me faz um salto de redirecionamento a mais
  // que às vezes se perde nesse contexto.
  return `https://api.whatsapp.com/send?phone=${numero}&text=${encodeURIComponent(mensagem)}`;
}

export function abrirWhatsapp(telefone: string, mensagem: string) {
  // location.href (em vez de window.open) navega a própria aba —
  // mais confiável pra disparar o handoff pro app nativo do WhatsApp
  // quando o site está rodando como PWA instalado.
  window.location.href = montarLinkWhatsapp(telefone, mensagem);
}

/**
 * Envia a mensagem já preenchida no WhatsApp COM o PDF anexado, através
 * da folha de compartilhamento nativa (ver limitação [2] no comentário
 * acima: não mira um contato específico automaticamente).
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
  linkConfirmacao?: string;
}): string {
  const { mensagemPadrao, nomeEstudante, tipo, semana, linkConfirmacao } = params;
  let msg =
    `Olá, ${nomeEstudante}!\n\n` +
    `${mensagemPadrao}\n\n` +
    `Designação: ${tipo}\n` +
    `Semana: ${semana}`;
  if (linkConfirmacao) {
    msg += `\n\nPor favor, confirme sua participação: ${linkConfirmacao}`;
  }
  return msg;
}

export function linkConfirmacao(token: string): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}confirmar/${token}`;
}
