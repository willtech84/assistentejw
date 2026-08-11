import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import type { PdfRecebido } from "../lib/database.types";
import PageHeader from "../components/PageHeader";
import { importarExcel } from "../services/excelImport";

export default function Pdfs() {
  const [lista, setLista] = useState<PdfRecebido[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [importando, setImportando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const inputExcel = useRef<HTMLInputElement>(null);
  const inputPdf = useRef<HTMLInputElement>(null);

  async function carregar() {
    setCarregando(true);
    const { data } = await supabase
      .from("pdfs_recebidos")
      .select("*")
      .order("recebido_em", { ascending: false });
    setLista(data ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
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

      const { error } = await supabase
        .from("designacoes")
        .insert(linhas.map((l) => ({ ...l, user_id: user.id })));

      if (error) throw error;
      setMensagem(`${linhas.length} designações importadas com sucesso.`);
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

    await supabase.from("pdfs_recebidos").insert({
      user_id: user.id,
      nome_arquivo: arquivo.name,
      caminho_arquivo: caminho,
    });

    setMensagem("PDF enviado com sucesso.");
    if (inputPdf.current) inputPdf.current.value = "";
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
              Colunas esperadas: Data, Tipo, Estudante, Ajudante, Sala, Semana.
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
              className="text-sm"
            />
          </div>
        </div>

        {mensagem && (
          <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
            {mensagem}
          </p>
        )}

        <div>
          <h2 className="mb-2 text-sm font-semibold text-slate-500">
            PDFs recebidos
          </h2>
          {carregando ? (
            <p className="text-sm text-slate-500">Carregando...</p>
          ) : lista.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum PDF ainda.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              {lista.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {p.nome_arquivo}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(p.recebido_em).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      p.processado
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {p.processado ? "Processado" : "Pendente"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
