// xlsx é carregado dinamicamente (import()) para não engordar o bundle
// inicial do app — só é baixado quando o usuário realmente usa a
// importação de planilha.
//
// A planilha real usada pelas congregações é o S-140 (Programação da
// Reunião Vida e Ministério Cristão) baixado do jw.org/programação —
// um layout bem mais rico que uma tabela simples: cada aba cobre
// 2 semanas, cada semana é um bloco de linhas com cabeçalho de data
// ("DD/MM/AAAA | Tema da leitura"), seguido pelas partes da reunião,
// cada uma podendo ter uma designação por sala (Sala C, Sala B, Salão
// principal) na mesma linha.
//
// Estrutura de colunas (fixa em todo o arquivo, conferida em vários
// S-140 reais):
//   B = hora / data do bloco da semana
//   D = descrição da parte (ex: "3. Leitura da Bíblia (4 min.)")
//   F = rótulo de estudante ("Estudante:" ou "Estudante/Ajudante:")
//   G = nome na Sala C
//   I = nome na Sala B
//   K = nome no Salão principal
//   J = rótulo administrativo ("Presidente:", "Oração:", "Dirigente da
//       sala B/C:", "Dirigente/Leitor:" do Estudo Bíblico) — essas
//       partes não têm S-89 (não são designações de estudante), mas o
//       usuário quer poder mandar lembrete/mensagem pra elas também,
//       então também viram designações — só que sem numero_parte
//       (o S-89 não seria preenchido pra essas mesmo se pedido).
//
// Nem toda linha com nome em G/I/K tem um rótulo (F ou J) — as partes
// de discurso lideradas por publicadores/anciãos (ex: "Joias
// espirituais", "Use seu tempo da melhor forma...") só têm a
// descrição em D e o nome direto em K, sem rótulo nenhum. Nesses
// casos o próprio texto de D vira o "tipo".
//
// Um detalhe: quando há rótulo em J (administrativo) a coluna D às
// vezes contém apenas o texto de um Cântico que por acaso está na
// mesma linha da Oração (ex: "Cântico 143" na linha da "Oração:" de
// encerramento) — nesse caso o rótulo é mais confiável que D, então
// D só é usado como tipo quando não é um Cântico.
//
// Um placeholder de planilha em branco (linha ainda não preenchida)
// aparece como "Nome", "Nome/Nome" ou "[Tema]" — essas linhas são
// puladas.

export interface LinhaImportada {
  data_reuniao: string; // YYYY-MM-DD
  tipo: string;
  numero_parte: string;
  estudante: string;
  ajudante: string;
  sala: string;
  semana: string;
}

const COL_DATA_BLOCO = 2; // B
const COL_DESCRICAO = 4; // D
const COL_ROTULO_ESTUDANTE = 6; // F
const COL_SALA_C = 7; // G
const COL_SALA_B = 9; // I
const COL_LABEL_ADMIN = 10; // J
const COL_SALAO_PRINCIPAL = 11; // K

const PLACEHOLDERS = new Set(["nome", "nome/nome", "[tema]"]);

function ehPlaceholder(valor: string): boolean {
  return valor === "" || PLACEHOLDERS.has(valor.toLowerCase());
}

function extrairDataDoBloco(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const m = valor.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s*\|/);
  if (!m) return null;
  return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

function extrairNumeroEParte(descricao: string): { numero: string; tipo: string } {
  const m = descricao.match(/^(\d+)\.\s*(.+)$/);
  const semNumero = m ? m[2] : descricao;
  const numero = m ? m[1] : "";
  // remove sufixo de duração, ex: "(4 min.)" ou "(X min.)"
  const tipo = semNumero.replace(/\s*\([^)]*min\.?\)\s*$/i, "").trim();
  return { numero, tipo };
}

function nomeDaSemana(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const inicio = new Date(Date.UTC(ano, mes - 1, dia));
  const fim = new Date(inicio);
  fim.setUTCDate(fim.getUTCDate() + 6);
  const fmt = (d: Date) => `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
  return `${fmt(inicio)} a ${fmt(fim)}`;
}

function celulaTexto(ws: import("xlsx").WorkSheet, XLSX: typeof import("xlsx"), row: number, col: number): string {
  const endereco = XLSX.utils.encode_cell({ r: row - 1, c: col - 1 });
  const celula = ws[endereco];
  if (!celula) return "";
  return String(celula.w ?? celula.v ?? "").trim();
}

function processarLinhasDeDesignacao(
  ws: import("xlsx").WorkSheet,
  XLSX: typeof import("xlsx"),
  linhaInicio: number,
  linhaFim: number,
  dataAtual: string
): LinhaImportada[] {
  const resultado: LinhaImportada[] = [];
  const semana = nomeDaSemana(dataAtual);

  for (let r = linhaInicio; r <= linhaFim; r++) {
    const rotuloEstudante = celulaTexto(ws, XLSX, r, COL_ROTULO_ESTUDANTE);
    const rotuloAdmin = celulaTexto(ws, XLSX, r, COL_LABEL_ADMIN);
    const rotulo = rotuloEstudante || rotuloAdmin;
    const rotuloLower = rotulo.toLowerCase();
    if (!rotulo) {
      // sem rótulo — só processa se houver descrição real em D (partes
      // de discurso, sem estudante nem cargo administrativo formal)
      const descricaoBruta = celulaTexto(ws, XLSX, r, COL_DESCRICAO);
      if (!descricaoBruta || /^cântico/i.test(descricaoBruta)) continue;
    }

    const descricao = celulaTexto(ws, XLSX, r, COL_DESCRICAO);
    const usaDescricao = descricao && !/^cântico/i.test(descricao);
    const { numero, tipo: tipoDaDescricao } = usaDescricao
      ? extrairNumeroEParte(descricao)
      : { numero: "", tipo: "" };
    const tipo = tipoDaDescricao || rotulo.replace(/:$/, "").trim();
    if (!tipo) continue;

    // sala: prioridade pro que o próprio rótulo diz ("sala B"/"sala C"),
    // senão pela coluna onde o nome apareceu
    const salaPorRotulo = rotuloLower.includes("sala b")
      ? "B"
      : rotuloLower.includes("sala c")
        ? "C"
        : null;

    const colunasPorSala: [string, number][] = [
      ["C", COL_SALA_C],
      ["B", COL_SALA_B],
      ["Principal", COL_SALAO_PRINCIPAL],
    ];

    for (const [salaColuna, col] of colunasPorSala) {
      const valor = celulaTexto(ws, XLSX, r, col);
      if (ehPlaceholder(valor)) continue;

      let estudante = valor;
      let ajudante = "";
      if (valor.includes("/")) {
        const [a, b] = valor.split("/");
        estudante = a.trim();
        ajudante = (b ?? "").trim();
      }

      resultado.push({
        data_reuniao: dataAtual,
        tipo,
        numero_parte: numero,
        estudante,
        ajudante,
        sala: salaPorRotulo ?? salaColuna,
        semana,
      });
    }
  }

  return resultado;
}

export async function importarExcel(arquivo: File): Promise<LinhaImportada[]> {
  const XLSX = await import("xlsx");
  const buffer = await arquivo.arrayBuffer();
  const planilha = XLSX.read(buffer, { type: "array" });

  const resultado: LinhaImportada[] = [];

  for (const nomeAba of planilha.SheetNames) {
    const ws = planilha.Sheets[nomeAba];
    const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1:A1");

    // Primeiro localiza todas as linhas de início de bloco de semana
    // (linha com "DD/MM/AAAA | ..." na coluna B), na ordem em que
    // aparecem, pra saber onde cada bloco começa e termina.
    const blocos: { linha: number; data: string }[] = [];
    for (let r = range.s.r + 1; r <= range.e.r + 1; r++) {
      const valor = celulaTexto(ws, XLSX, r, COL_DATA_BLOCO);
      const data = extrairDataDoBloco(valor);
      if (data) blocos.push({ linha: r, data });
    }

    for (let i = 0; i < blocos.length; i++) {
      const inicio = blocos[i].linha;
      const fim = i + 1 < blocos.length ? blocos[i + 1].linha - 1 : range.e.r + 1;
      resultado.push(
        ...processarLinhasDeDesignacao(ws, XLSX, inicio, fim, blocos[i].data)
      );
    }
  }

  return resultado;
}
