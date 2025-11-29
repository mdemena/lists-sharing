// frontend/src/types/index.ts

import type { User } from '@supabase/supabase-js';

// Tipo básico del usuario, extendiendo el tipo de Supabase
export interface AppUser extends User {
    // Aquí puedes añadir campos específicos del perfil si los creas
    // Ejemplo: username?: string;
}

export interface Profile {
    id: string;
    date_of_birth: string | null;
    updated_at: string;
}

// Interfaz para URLs generales (enlaces a tiendas, etc.)
export interface ExternalUrl {
    url: string;
    label: string;
}

// Interfaz para Imágenes (podríamos añadir una descripción opcional si es necesario)
export interface ImageUrl extends ExternalUrl { }
// Usaremos la misma estructura: { url: string, label: string }

// --- Listas y Elementos ---

export interface List {
    id: string; // uuid
    owner_id: string; // uuid de auth.users(id)
    name: string;
    description: string | null;
    created_at: string; // timestamp
    list_shares?: { count: number }[];
}

// Modelo de un Elemento de la Lista
export interface ListItem {
    id: string; // uuid
    list_id: string; // uuid
    name: string;
    description: string | null;
    image_urls: ImageUrl[] | null;
    urls: ExternalUrl[] | null;
    importance: 1 | 2 | 3 | 4 | 5;
    estimated_cost: number | null;
    is_adjudicated: boolean;
    adjudicated_by: string | null;
    adjudicated_at: string | null;
}

export interface SharedUser {
    email: string;
    is_registered: boolean;
}
