// Disparo de mensagem em massa — mesmo padrão usado no SuperVenda:
// uma lista de contatos, cada um com um botão "Enviar" que abre o
// WhatsApp direto naquele contato com a mensagem já pronta. Diferente
// das Designações, aqui não há vínculo com uma designação específica
// nem anexo de PDF — é pra avisos gerais (ex: "reunião cancelada essa
// semana", "lembrete de assembleia").

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Estudante } from "../lib/database.types";
import PageHeader from "../components/PageHeader";
import { abrirWhatsapp } from "../services/whatsapp";

export default function Disparo() {
  const [estudantes, setEstudantes] = useState<Estudante[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviados, setEnviados] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase
      .from("estudantes")
      .select("*")
      .eq("ativo", true)
      .order("nome", { ascending: true })
      .then(({ data }) => {
        setEstudantes(data ?? []);
        setCarregando(false);
      });
  }, []);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return estudantes;
    return estudantes.filter((e) => e.nome.toLowerCase().includes(termo));
  }, [estudantes, busca]);

  async function enviarPara(e: Estudante) {
    if (!e.telefone) {
      alert(`"${e.nome}" não tem telefone cadastrado.`);
      return;
    }
    const texto = mensagem.replace(/\{nome\}/gi, e.nome.split(" ")[0]);
    abrirWhatsapp(e.telefone, texto);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("historico_envios").insert({
      estudante_id: e.id,
      estudante: e.nome,
      telefone: e.telefone,
      mensagem: texto,
      sucesso: true,
      user_id: user?.id,
    });
    setEnviados((prev) => new Set(prev).add(e.id));
  }

  return (
    <div>
      <PageHeader title="Disparo de Mensagem" />
      <div className="space-y-4 p-4 md:p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Mensagem
          </label>
          <textarea
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            rows={4}
            placeholder="Ex: Olá {nome}! A reunião desta semana foi remarcada para..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-slate-400">
            Use {"{nome}"} pra inserir o primeiro nome de cada pessoa automaticamente.
          </p>
        </div>

        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
        />

        {!mensagem.trim() && (
          <p className="text-xs text-amber-600">
            ⚠️ Digite uma mensagem acima antes de enviar — os botões "Enviar" ficam
            desativados até lá.
          </p>
        )}

        {carregando ? (
          <p className="text-sm text-slate-500">Carregando...</p>
        ) : filtrados.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum estudante encontrado.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {filtrados.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{e.nome}</p>
                  {!e.telefone && (
                    <p className="text-xs text-red-500">Sem telefone cadastrado</p>
                  )}
                </div>
                <button
                  onClick={() => enviarPara(e)}
                  disabled={!mensagem.trim() || !e.telefone}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                    enviados.has(e.id)
                      ? "border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  {enviados.has(e.id) ? "Reenviar" : "Enviar"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
