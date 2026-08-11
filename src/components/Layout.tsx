import { NavLink, Outlet } from "react-router-dom";
import { supabase } from "../lib/supabase";

const ITENS = [
  { to: "/", label: "Início", icone: "🏠", fim: true },
  { to: "/designacoes", label: "Designações", icone: "📋" },
  { to: "/agenda", label: "Agenda", icone: "📅" },
  { to: "/estudantes", label: "Estudantes", icone: "👥" },
  { to: "/pdfs", label: "PDFs", icone: "📄" },
  { to: "/envios", label: "Envios", icone: "💬" },
  { to: "/historico", label: "Histórico", icone: "🕓" },
  { to: "/configuracoes", label: "Configurações", icone: "⚙️" },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 md:flex-row">
      <nav className="hidden w-56 flex-col border-r border-slate-200 bg-white p-4 md:flex">
        <h1 className="mb-6 px-2 text-lg font-semibold text-slate-900">
          Assistente JW
        </h1>
        <div className="flex flex-1 flex-col gap-1">
          {ITENS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.fim}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  isActive
                    ? "bg-indigo-50 font-medium text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              <span>{item.icone}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="mt-4 rounded-lg px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-100"
        >
          Sair
        </button>
      </nav>

      <main className="flex-1 pb-16 md:pb-0">
        <Outlet />
      </main>

      {/* navegação inferior no mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex justify-around border-t border-slate-200 bg-white py-2 md:hidden">
        {ITENS.slice(0, 5).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.fim}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 text-xs ${
                isActive ? "text-indigo-700" : "text-slate-500"
              }`
            }
          >
            <span className="text-lg">{item.icone}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
