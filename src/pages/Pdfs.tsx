import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import type { PdfRecebido } from "../lib/database.types";
import PageHeader from "../components/PageHeader";
import { importarExcel } from "../services/excelImport";
import {
  carregarEstudantesDoUsuario,
  resolverEstudanteId,
  type EstudanteBasico,
} from "../services/estudanteMatch";
import { processarPdf } from "../services/pdfExtract";
import { obterPdfCompartilhado } from "../services/shareTarget";
import { TIPOS_DESIGNACAO } from "../lib/constants";

export default function Pdfs() {
  const [lista, setLista] = useState<PdfRecebido[]>([]);
  const [estudantes, setEstudantes] = useState<EstudanteBasico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [importando, setImportando] = useState(false);
  const [extraindo, setExtraindo] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const inputExcel = useRef<HTMLInputElement>(null);
  const inputPdf = useRef<HTMLInputElement>(null);

  async function carregar(): Promise<EstudanteBasico[]> {
    setCarregando(true);
    const [{ data }, listaEstudantes] = await Promise.all([
      supabase
        .from("pdfs_recebidos")
        .select("*")
        .order("recebido_em", { ascending: false }),
      carregarEstudantesDoUsuario(),
    ]);
    setLista(data ?? []);
    setEstudantes(listaEstudantes);
    setCarregando(false);
    return listaEstudantes;
  }

  useEffect(() => {
    // carrega a lista de estudantes ANTES de checar compartilhamento —
    // processarEEnviarPdf precisa da lista já disponível para sugerir o
    // estudante certo. Passamos a lista explicitamente (em vez de
    // depender do estado `estudantes`) para não pegar um valor
    // desatualizado — o setEstudantes acima só reflete no próximo
    // render, e este efeito roda antes disso.
    carregar().then((listaEstudantes) => {
      // Chegou aqui via "Compartilhar" de outro app (Web Share Target)?
      // O service worker já guardou o PDF na Cache Storage — busca e
      // processa exatamente como um upload manual.
      const params = new URLSearchParams(window.location.search);
      if (params.get("compartilhado") !== "1") return;

      // limpa a URL imediatamente para não tentar de novo num refresh
      window.history.replaceState({}, "", window.location.pathname);

      obterPdfCompartilhado().then((arquivo) => {
        if (arquivo) {
          setMensagem("PDF recebido por compartilhamento. Processando...");
          processarEEnviarPdf(arquivo, listaEstudantes);
        }
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleImportarExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    setImportando(true);
    setMensagem(null);
    try {
      const linhas = await importarExcel(arquivo);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada");

      const estudantes = await carregarEstudantesDoUsuario();
      const semVinculo: string[] = [];
      const paraInserir = linhas.map((l) => {
        const estudante_id = resolverEstudanteId(l.estudante, estudantes);
        if (l.estudante && !estudante_id) semVinculo.push(l.estudante);
        return { ...l, estudante_id, user_id: user.id };
      });

      const { error } = await supabase.from("designacoes").insert(paraInserir);

      if (error) throw error;

      const avisoVinculo =
        semVinculo.length > 0
          ? ` ${new Set(semVinculo).size} nome(s) não encontrados no cadastro de estudantes — vincule manualmente em "Designações": ${[...new Set(semVinculo)].join(", ")}.`
          : "";
      setMensagem(
        `${linhas.length} designações importadas com sucesso.${avisoVinculo}`
      );
    } catch (err) {
      setMensagem(
        `Erro ao importar: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setImportando(false);
      if (inputExcel.current) inputExcel.current.value = "";
    }
  }

  async function handleUploadPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    await processarEEnviarPdf(arquivo);
    if (inputPdf.current) inputPdf.current.value = "";
  }

  async function processarEEnviarPdf(
    arquivo: File,
    estudantesParaSugestao: EstudanteBasico[] = estudantes
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const caminho = `${user.id}/${Date.now()}_${arquivo.name}`;
    const { error: erroUpload } = await supabase.storage
      .from("pdfs")
      .upload(caminho, arquivo);

    if (erroUpload) {
      setMensagem(`Erro ao enviar PDF: ${erroUpload.message}`);
      return;
    }

    // Extração de texto é "melhor esforço": se o PDF for uma imagem
    // escaneada (sem camada de texto) ou o parsing falhar por qualquer
    // motivo, o upload já foi feito — só não teremos sugestão
    // automática, e o usuário revisa manualmente.
    let texto = "";
    let estudanteIdSugerido: string | null = null;
    let tipoSugerido: string | null = null;
    setExtraindo(true);
    try {
      const resultado = await processarPdf(arquivo, estudantesParaSugestao);
      texto = resultado.texto;
      estudanteIdSugerido = resultado.estudanteIdSugerido;
      tipoSugerido = resultado.tipoSugerido;
    } catch (err) {
      console.warn("Falha ao extrair texto do PDF:", err);
    } finally {
      setExtraindo(false);
    }

    await supabase.from("pdfs_recebidos").insert({
      user_id: user.id,
      nome_arquivo: arquivo.name,
      caminho_arquivo: caminho,
      texto_extraido: texto || null,
      estudante_id: estudanteIdSugerido,
      tipo_detectado: tipoSugerido ?? "",
      processado: false,
    });

    setMensagem(
      estudanteIdSugerido || tipoSugerido
        ? "PDF enviado. Confira a sugestão abaixo e confirme."
        : "PDF enviado. Não foi possível sugerir estudante/tipo automaticamente — preencha manualmente abaixo."
    );
    carregar();
  }

  async function confirmarRevisao(
    pdf: PdfRecebido,
    estudante_id: string,
    tipo_detectado: string
  ) {
    const estudante = estudantes.find((e) => e.id === estudante_id);
    await supabase
      .from("pdfs_recebidos")
      .update({
        estudante_id: estudante_id || null,
        estudante: estudante?.nome ?? "",
        tipo_detectado,
        processado: true,
      })
      .eq("id", pdf.id);
    carregar();
  }

  async function excluirPdf(p: PdfRecebido) {
    if (!confirm(`Excluir "${p.nome_arquivo}"? O arquivo também será apagado do armazenamento.`))
      return;
    if (p.caminho_arquivo) {
      await supabase.storage.from("pdfs").remove([p.caminho_arquivo]);
    }
    await supabase.from("pdfs_recebidos").delete().eq("id", p.id);
    carregar();
  }

  async function limparTodosPdfs() {
    if (
      !confirm(
        `Excluir TODOS os ${lista.length} PDFs recebidos (e os arquivos no armazenamento)? Essa ação não pode ser desfeita.`
      )
    )
      return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const caminhos = lista.map((p) => p.caminho_arquivo).filter(Boolean) as string[];
    if (caminhos.length > 0) {
      await supabase.storage.from("pdfs").remove(caminhos);
    }
    await supabase.from("pdfs_recebidos").delete().eq("user_id", user.id);
    carregar();
  }

  return (
    <div>
      <PageHeader title="PDFs e Importação" />

      <div className="space-y-6 p-4 md:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-1 text-sm font-semibold text-slate-900">
              Importar designações (Excel)
            </h2>
            <p className="mb-3 text-xs text-slate-500">
              Envie o S-140 (planilha de programação da reunião, baixada do
              jw.org) — detecta datas, salas e designações automaticamente.
            </p>
            <input
              ref={inputExcel}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleImportarExcel}
              disabled={importando}
              className="text-sm"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-1 text-sm font-semibold text-slate-900">
              Enviar PDF de designação
            </h2>
            <p className="mb-3 text-xs text-slate-500">
              Armazenado no seu Supabase Storage, associado à sua conta.
            </p>
            <input
              ref={inputPdf}
              type="file"
              accept="application/pdf"
              onChange={handleUploadPdf}
              disabled={extraindo}
              className="text-sm"
            />
            {extraindo && (
              <p className="mt-2 text-xs text-slate-400">Extraindo texto do PDF...</p>
            )}
          </div>
        </div>

        {mensagem && (
          <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
            {mensagem}
          </p>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-500">
              PDFs recebidos
            </h2>
            {lista.length > 0 && (
              <button
                onClick={limparTodosPdfs}
                className="rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                Limpar tudo
              </button>
            )}
          </div>
          {carregando ? (
            <p className="text-sm text-slate-500">Carregando...</p>
          ) : lista.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum PDF ainda.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              {lista.map((p) => (
                <div
                  key={p.id}
                  className="border-b border-slate-100 px-4 py-3 last:border-0"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {p.nome_arquivo}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(p.recebido_em).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          p.processado
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {p.processado ? "Processado" : "Pendente"}
                      </span>
                      <button
                        onClick={() => excluirPdf(p)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>

                  {!p.processado && (
                    <RevisaoPdf
                      pdf={p}
                      estudantes={estudantes}
                      onConfirmar={confirmarRevisao}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RevisaoPdf({
  pdf,
  estudantes,
  onConfirmar,
}: {
  pdf: PdfRecebido;
  estudantes: EstudanteBasico[];
  onConfirmar: (
    pdf: PdfRecebido,
    estudante_id: string,
    tipo_detectado: string
  ) => void;
}) {
  const [estudanteId, setEstudanteId] = useState(pdf.estudante_id ?? "");
  const [tipo, setTipo] = useState(pdf.tipo_detectado ?? "");
  const [mostrarTexto, setMostrarTexto] = useState(false);

  return (
    <div className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Estudante {pdf.estudante_id && "(sugerido)"}
          </label>
          <select
            value={estudanteId}
            onChange={(e) => setEstudanteId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">Selecione...</option>
            {estudantes.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Tipo {pdf.tipo_detectado && "(sugerido)"}
          </label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">Selecione...</option>
            {TIPOS_DESIGNACAO.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {pdf.texto_extraido && (
        <div>
          <button
            type="button"
            onClick={() => setMostrarTexto((v) => !v)}
            className="text-xs text-indigo-600 hover:underline"
          >
            {mostrarTexto ? "Ocultar" : "Ver"} texto extraído
          </button>
          {mostrarTexto && (
            <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded border border-slate-200 bg-white p-2 text-xs text-slate-600">
              {pdf.texto_extraido}
            </pre>
          )}
        </div>
      )}

      <button
        type="button"
        disabled={!estudanteId || !tipo}
        onClick={() => onConfirmar(pdf, estudanteId, tipo)}
        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Confirmar
      </button>
    </div>
  );
}
