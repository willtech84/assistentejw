// Gera o PDF do formulário S-89 (Designação para a Reunião) já
// preenchido com os dados de uma designação — usado no envio via
// WhatsApp (ver services/whatsapp.ts) para anexar o formulário pronto
// junto com a mensagem.
//
// O molde é public/s89-template.pdf (baixado em branco do jw.org) e
// tem campos de formulário reais (AcroForm), então só precisamos
// preencher os valores — não desenhar texto por cima. Mapeamento dos
// campos (conferido visualmente, o PDF não nomeia os campos de forma
// óbvia):
//   900_1_Text_SanSerif -> Nome (estudante)
//   900_2_Text_SanSerif -> Ajudante
//   900_3_Text_SanSerif -> Data
//   900_4_Text_SanSerif -> Número da parte
//   900_5_CheckBox      -> Local: Salão principal
//   900_6_CheckBox      -> Local: Sala B
//   900_7_CheckBox      -> Local: Sala C

import { PDFDocument } from "pdf-lib";
import type { Designacao } from "../lib/database.types";

const CAMPO_NOME = "900_1_Text_SanSerif";
const CAMPO_AJUDANTE = "900_2_Text_SanSerif";
const CAMPO_DATA = "900_3_Text_SanSerif";
const CAMPO_NUMERO_PARTE = "900_4_Text_SanSerif";

const CAMPO_SALA: Record<string, string> = {
  Principal: "900_5_CheckBox",
  B: "900_6_CheckBox",
  C: "900_7_CheckBox",
};

function formatarData(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split("-");
  if (!ano || !mes || !dia) return dataISO;
  return `${dia}/${mes}/${ano}`;
}

/**
 * Preenche o molde do S-89 com os dados da designação e devolve os
 * bytes do PDF pronto (para baixar, anexar ou compartilhar).
 */
export async function gerarS89(designacao: Designacao): Promise<Uint8Array> {
  const moldeBytes = await fetch(
    `${import.meta.env.BASE_URL}s89-template.pdf`
  ).then((r) => r.arrayBuffer());

  const pdf = await PDFDocument.load(moldeBytes);
  const form = pdf.getForm();

  form.getTextField(CAMPO_NOME).setText(designacao.estudante);
  form.getTextField(CAMPO_AJUDANTE).setText(designacao.ajudante || "");
  form.getTextField(CAMPO_DATA).setText(formatarData(designacao.data_reuniao));
  form
    .getTextField(CAMPO_NUMERO_PARTE)
    .setText(designacao.numero_parte || "");

  const campoSala = CAMPO_SALA[designacao.sala] ?? CAMPO_SALA.Principal;
  form.getCheckBox(campoSala).check();

  // Importante: NÃO chamamos form.flatten() aqui. O flatten regenera a
  // aparência dos checkboxes do zero e, neste molde específico, produz
  // uma marca gigante e desalinhada (o BBox/Matrix da aparência
  // original do PDF não é respeitado corretamente pelo gerador padrão
  // do pdf-lib). Sem o flatten, o pdf-lib reaproveita a aparência de
  // "marcado" que já vem pronta no próprio PDF — pequena e no lugar
  // certo — e isso é suportado por qualquer leitor de PDF (WhatsApp,
  // Google Fotos, Adobe, navegador), então não perdemos nada em
  // compatibilidade por deixar os campos como formulário interativo.
  form.updateFieldAppearances();

  return pdf.save();
}

export function nomeArquivoS89(designacao: Designacao): string {
  const nome = designacao.estudante.replace(/[^\p{L}\p{N} ]/gu, "").trim();
  return `S-89 - ${nome || "designacao"} - ${formatarData(
    designacao.data_reuniao
  ).replace(/\//g, "-")}.pdf`;
}
