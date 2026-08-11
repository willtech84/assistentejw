import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // eslint-disable-next-line no-console
  console.error(
    "VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY não configurados. " +
      "Copie .env.example para .env.local e preencha com os dados do seu projeto Supabase."
  );
}

export const supabase = createClient<Database>(url ?? "", anonKey ?? "");
