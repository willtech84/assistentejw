// Extração de texto de PDF, client-side, via pdfjs-dist. Carregado
// dinamicamente (mesmo padrão de excelImport.ts com xlsx) para não
// engordar o bundle inicial.
//
// IMPORTANTE — honestidade sobre o que isto faz:
// Não existe um layout oficial único de PDF de designação (cada
// congregação/app gera o seu). Em vez de tentar adivinhar posições de
// texto num layout específico (frágil e provavelmente errado para o
// PDF de outra pessoa), a heurística aqui é deliberadamente simples e
// verificável:
//   1. Extrai todo o texto do PDF.
//   2. Procura, dentro desse texto, por qualquer nome já cadastrado em
//      "Estudantes" (comparação sem acento/maiúsculas).
//   3. Procura por qualquer um dos TIPOS_DESIGNACAO conhecidos.
// O resultado é sempre uma SUGESTÃO — o usuário confirma ou corrige
// antes de salvar (ver Pdfs.tsx). Isso é mais confiável do que tentar
// parsear coordenadas/layout sem uma amostra real do PDF em questão.

import { TIPOS_DESIGNACAO } from "../lib/constants";
import { normalizarTexto } from "./estudanteMatch";
import type { EstudanteBasico } from "./estudanteMatch";

export interface ExtracaoPdf {
  texto: string;
  estudanteIdSugerido: string | null;
  tipoSugerido: string | null;
}

export async function extrairTextoPdf(arquivo: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // worker precisa ser carregado como URL para funcionar com o bundler
  // do Vite (sem isso o pdfjs tenta importar o worker via caminho
  // relativo que não existe no bundle final).
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.mjs?url"))
    .default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const buffer = await arquivo.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buffer }).promise;

  const partes: string[] = [];
  for (let pagina = 1; pagina <= doc.numPages; pagina++) {
    const page = await doc.getPage(pagina);
    const conteudo = await page.getTextContent();
    const linha = conteudo.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    partes.push(linha);
  }
  return partes.join("\n").trim();
}

export function sugerirVinculos(
  texto: string,
  estudantes: EstudanteBasico[]
): Pick<ExtracaoPdf, "estudanteIdSugerido" | "tipoSugerido"> {
  const textoNormalizado = normalizarTexto(texto);

  const candidatos = estudantes.filter((e) =>
    textoNormalizado.includes(normalizarTexto(e.nome))
  );
  // só sugere automaticamente quando há exatamente 1 nome cadastrado
  // encontrado no texto — ambiguidade fica para o usuário resolver.
  const estudanteIdSugerido =
    candidatos.length === 1 ? candidatos[0].id : null;

  const tipoSugerido =
    TIPOS_DESIGNACAO.find((t) =>
      textoNormalizado.includes(normalizarTexto(t))
    ) ?? null;

  return { estudanteIdSugerido, tipoSugerido };
}

export async function processarPdf(
  arquivo: File,
  estudantes: EstudanteBasico[]
): Promise<ExtracaoPdf> {
  const texto = await extrairTextoPdf(arquivo);
  const sugestoes = sugerirVinculos(texto, estudantes);
  return { texto, ...sugestoes };
}
