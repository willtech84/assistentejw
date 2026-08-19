// Lê o PDF que o service worker (src/sw.ts) guardou na Cache Storage
// ao receber um compartilhamento via Web Share Target. Ver o comentário
// no topo de src/sw.ts para o fluxo completo.

const CACHE_SHARE_TARGET = "assistente-jw-share-target";

export async function obterPdfCompartilhado(): Promise<File | null> {
  if (!("caches" in window)) return null;

  const cache = await caches.open(CACHE_SHARE_TARGET);
  const respostaUltimo = await cache.match("/__shared-pdf__/ultimo");
  if (!respostaUltimo) return null;

  const chave = await respostaUltimo.text();
  const respostaArquivo = await cache.match(chave);

  // limpa sempre, mesmo se o arquivo não for encontrado, para não
  // ficar tentando de novo a cada visita
  await cache.delete("/__shared-pdf__/ultimo");
  if (!respostaArquivo) return null;
  await cache.delete(chave);

  const blob = await respostaArquivo.blob();
  const nome = chave.split("/").pop()?.replace(/^\d+_/, "") ?? "compartilhado.pdf";
  return new File([blob], nome, { type: blob.type || "application/pdf" });
}
