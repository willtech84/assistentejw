// Resolução de nome (texto livre, vindo de planilha/PDF/formulário) para
// o id de um estudante já cadastrado. Usado na importação de Excel, na
// extração de PDF e como fallback ao editar uma designação manualmente.
//
// Importante: isso só roda em UM momento — na hora de gravar o dado.
// Depois disso, todo o resto do app (Envios, histórico) usa o
// estudante_id gravado, sem repetir o casamento por nome a cada leitura
// (que era a fonte de bugs em Envios.tsx/Designacoes.tsx antes desta
// mudança: nomes duplicados ou digitação diferente causavam envio para
// a pessoa errada, silenciosamente).

import { supabase } from "../lib/supabase";
import type { Estudante } from "../lib/database.types";

export type EstudanteBasico = Pick<Estudante, "id" | "nome">;

export function normalizarTexto(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // remove acentos
}

export async function carregarEstudantesDoUsuario(): Promise<EstudanteBasico[]> {
  const { data } = await supabase.from("estudantes").select("id, nome");
  return data ?? [];
}

/**
 * Resolve um nome de texto livre para o id de um estudante cadastrado.
 * Retorna null quando não há exatamente uma correspondência (nenhuma
 * ou mais de uma) — nesses casos o vínculo deve ser feito manualmente
 * pelo usuário, em vez de adivinhar.
 */
export function resolverEstudanteId(
  nome: string,
  estudantes: EstudanteBasico[]
): string | null {
  if (!nome?.trim()) return null;
  const alvo = normalizarTexto(nome);
  const encontrados = estudantes.filter((e) => normalizarTexto(e.nome) === alvo);
  return encontrados.length === 1 ? encontrados[0].id : null;
}
