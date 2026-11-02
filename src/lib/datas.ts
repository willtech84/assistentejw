// Formata uma data ISO (aaaa-mm-dd) como dd/mm/aaaa, sem passar por
// `new Date()` — evita o deslocamento de fuso que faz "2026-11-02"
// virar 01/11 em alguns navegadores.
export function formatarDataBR(dataISO: string | null | undefined): string {
  if (!dataISO) return "";
  const [ano, mes, dia] = dataISO.slice(0, 10).split("-");
  if (!ano || !mes || !dia) return dataISO;
  return `${dia}/${mes}/${ano}`;
}

export function diaDaSemana(dataISO: string): string {
  return new Date(dataISO + "T00:00:00").toLocaleDateString("pt-BR", {
    weekday: "long",
  });
}
