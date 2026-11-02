import { salvarModoS89, type ModoS89 } from "../services/envioDesignacao";

const DESCRICAO: Record<ModoS89, string> = {
  link: "abre direto no contato; o S-89 vai como link na mensagem",
  anexo: "abre a lista de apps; escolha o contato (a mensagem pode não ir)",
  nenhum: "abre direto no contato, só a mensagem",
};

export default function ModoS89Select({
  value,
  onChange,
}: {
  value: ModoS89;
  onChange: (m: ModoS89) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="text-sm text-slate-600" htmlFor="modo-s89">
        S-89:
      </label>
      <select
        id="modo-s89"
        value={value}
        onChange={(e) => {
          const m = e.target.value as ModoS89;
          salvarModoS89(m);
          onChange(m);
        }}
        className="rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-900"
      >
        <option value="link">Link na mensagem</option>
        <option value="anexo">Anexar PDF</option>
        <option value="nenhum">Sem S-89</option>
      </select>
      <span className="text-xs text-slate-400">— {DESCRICAO[value]}</span>
    </div>
  );
}
