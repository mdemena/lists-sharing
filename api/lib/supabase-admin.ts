// api/lib/supabase-admin.ts
import { createClient } from "@supabase/supabase-js";

// Configuración desde variables de entorno (leídas en runtime)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("Missing Supabase environment variables for admin client");
}

// Cliente de Supabase con privilegios de administrador (Service Role)
export const supabaseAdmin = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    },
);
