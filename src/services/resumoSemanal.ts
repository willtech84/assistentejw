// Gera um PDF resumindo, para uma semana, quem confirmou, quem não vai
// poder (com substituto sugerido, se houver) e quem ainda não
// respondeu — a partir do campo confirmacao_status preenchido pela
// própria pessoa através do link público (/confirmar/<token>, ver
// services/whatsapp.ts e pages/Confirmar.tsx).
//
// Diferente do S-89 (que preenche um molde existente), aqui não há
// molde — o PDF é desenhado do zero com pdf-lib, então o texto é
// escrito diretamente com drawText.

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { Designacao } from "../lib/database.types";

const MARGEM = 50;
const LARGURA = 595.28; // A4 retrato, em pontos
const ALTURA = 841.89;

function linhaDesignacao(d: Designacao): string {
  const partes = [d.tipo];
  if (d.estudante) partes.push(d.estudante);
  if (d.ajudante) partes.push(`+ ${d.ajudante}`);
  return partes.join(" — ");
}

export async function gerarResumoSemanal(
  designacoes: Designacao[],
  semana: string
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const fonte = await pdf.embedFont(StandardFonts.Helvetica);
  const fonteNegrito = await pdf.embedFont(StandardFonts.HelveticaBold);

  let pagina = pdf.addPage([LARGURA, ALTURA]);
  let y = ALTURA - MARGEM;

  function novaLinha(altura = 16) {
    y -= altura;
    if (y < MARGEM) {
      pagina = pdf.addPage([LARGURA, ALTURA]);
      y = ALTURA - MARGEM;
    }
  }

  function texto(
    conteudo: string,
    opts: { tamanho?: number; negrito?: boolean; cor?: [number, number, number] } = {}
  ) {
    const { tamanho = 11, negrito = false, cor = [0.1, 0.1, 0.1] } = opts;
    pagina.drawText(conteudo, {
      x: MARGEM,
      y,
      size: tamanho,
      font: negrito ? fonteNegrito : fonte,
      color: rgb(...cor),
    });
  }

  texto("Resumo semanal de designações", { tamanho: 16, negrito: true });
  novaLinha(24);
  texto(`Semana: ${semana}`, { tamanho: 11, cor: [0.4, 0.4, 0.4] });
  novaLinha(28);

  const confirmados = designacoes.filter((d) => d.confirmacao_status === "confirmado");
  const recusados = designacoes.filter((d) => d.confirmacao_status === "recusado");
  const pendentes = designacoes.filter(
    (d) => d.confirmacao_status !== "confirmado" && d.confirmacao_status !== "recusado"
  );

  function secao(titulo: string, itens: Designacao[], cor: [number, number, number]) {
    texto(`${titulo} (${itens.length})`, { tamanho: 13, negrito: true, cor });
    novaLinha(20);
    if (itens.length === 0) {
      texto("Nenhum.", { tamanho: 10, cor: [0.5, 0.5, 0.5] });
      novaLinha(18);
    }
    for (const d of itens) {
      texto(`•  ${linhaDesignacao(d)}`, { tamanho: 10.5 });
      novaLinha(15);
      if (d.confirmacao_status === "recusado" && d.substituto_sugerido) {
        texto(`   Substituto sugerido: ${d.substituto_sugerido}`, {
          tamanho: 9.5,
          cor: [0.45, 0.45, 0.45],
        });
        novaLinha(14);
      }
    }
    novaLinha(10);
  }

  secao("✅ Confirmaram", confirmados, [0.05, 0.45, 0.25]);
  secao("❌ Não vão poder", recusados, [0.6, 0.1, 0.1]);
  secao("⏳ Ainda sem resposta", pendentes, [0.5, 0.4, 0]);

  return pdf.save();
}

export function nomeArquivoResumo(semana: string): string {
  const limpo = semana.replace(/[^\p{L}\p{N} ]/gu, "").trim();
  return `Resumo - ${limpo || "semana"}.pdf`;
}
