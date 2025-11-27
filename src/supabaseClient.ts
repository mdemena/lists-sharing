// frontend/src/supabaseClient.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- Verificación de Variables de Entorno ---

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    // Lanza un error claro si falta alguna clave
    throw new Error("Missing Supabase configuration variables. Check your SUPABASE_URL and SUPABASE_ANON_KEY in .env file.");
}

// --- Creación del Cliente Tipado ---

/**
 * El cliente de Supabase para interactuar con la base de datos, autenticación y almacenamiento.
 * Usamos el tipo genérico SupabaseClient para que TypeScript reconozca todos los métodos.
 */
export const supabase: SupabaseClient = createClient(
    supabaseUrl,
    supabaseAnonKey
);

// Nota: Si usaras tipado más avanzado para tus tablas (generado por Supabase CLI),
// el tipo sería: SupabaseClient<Database> donde Database es la interfaz de tu esquema.