import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Designacoes from "./pages/Designacoes";
import Agenda from "./pages/Agenda";
import Estudantes from "./pages/Estudantes";
import Pdfs from "./pages/Pdfs";
import Envios from "./pages/Envios";
import Historico from "./pages/Historico";
import Configuracoes from "./pages/Configuracoes";
import Sobre from "./pages/Sobre";

function RotasProtegidas() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">
        Carregando...
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="designacoes" element={<Designacoes />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="estudantes" element={<Estudantes />} />
        <Route path="pdfs" element={<Pdfs />} />
        <Route path="envios" element={<Envios />} />
        <Route path="historico" element={<Historico />} />
        <Route path="configuracoes" element={<Configuracoes />} />
        <Route path="sobre" element={<Sobre />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <RotasProtegidas />
    </BrowserRouter>
  );
}
