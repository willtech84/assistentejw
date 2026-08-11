// xlsx é carregado dinamicamente (import()) para não engordar o bundle
// inicial do app — só é baixado quando o usuário realmente usa a
// importação de planilha.

// Formato esperado da planilha (colunas por cabeçalho, sem diferenciar
// maiúsculas/minúsculas): Data | Tipo | Estudante | Ajudante | Sala | Semana
//
// Isso é uma convenção nossa (o app Flutter original nunca chegou a
// implementar o parser de verdade — meeting_schedule_parser.dart e
// excel_import_service.dart eram stubs de 12-40 linhas). Ajuste os
// nomes de coluna abaixo se sua planilha usar outro formato.

export interface LinhaImportada {
  data_reuniao: string; // YYYY-MM-DD
  tipo: string;
  estudante: string;
  ajudante: string;
  sala: string;
  semana: string;
}

function excelDataParaISO(valor: unknown, SSF: typeof import("xlsx").SSF): string {
  if (typeof valor === "number") {
    // número de série do Excel (dias desde 1900-01-01, com o bug do ano bissexto)
    const data = SSF.parse_date_code(valor);
    return `${data.y}-${String(data.m).padStart(2, "0")}-${String(data.d).padStart(2, "0")}`;
  }
  if (typeof valor === "string") {
    // tenta DD/MM/AAAA
    const m = valor.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    // já pode estar em ISO
    if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor;
  }
  throw new Error(`Data inválida na planilha: ${String(valor)}`);
}

export async function importarExcel(arquivo: File): Promise<LinhaImportada[]> {
  const XLSX = await import("xlsx");
  const buffer = await arquivo.arrayBuffer();
  const planilha = XLSX.read(buffer, { type: "array" });
  const aba = planilha.Sheets[planilha.SheetNames[0]];
  const linhas = XLSX.utils.sheet_to_json<Record<string, unknown>>(aba, {
    defval: "",
  });

  return linhas
    .filter((linha) => linha["Data"] || linha["data"])
    .map((linha) => {
      const pegar = (chave: string) =>
        String(linha[chave] ?? linha[chave.toLowerCase()] ?? "").trim();

      return {
        data_reuniao: excelDataParaISO(linha["Data"] ?? linha["data"], XLSX.SSF),
        tipo: pegar("Tipo"),
        estudante: pegar("Estudante"),
        ajudante: pegar("Ajudante"),
        sala: pegar("Sala") || "Principal",
        semana: pegar("Semana"),
      };
    });
}
