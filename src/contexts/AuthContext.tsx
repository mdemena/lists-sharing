// frontend/src/contexts/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type Session, AuthError, type SignInWithPasswordCredentials, type SignUpWithPasswordCredentials } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient.ts';
import type { AppUser } from '../types'; // Importamos el tipo AppUser

// 1. Definir la interfaz del valor que provee el Context
interface AuthContextType {
    session: Session | null;
    user: AppUser | null;
    loading: boolean;
    signUp: (data: SignUpWithPasswordCredentials) => Promise<{ error: AuthError | null }>;
    signIn: (data: SignInWithPasswordCredentials) => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<{ error: AuthError | null }>;
}

// Valor por defecto con funciones dummy que cumplen con la promesa
const defaultContextValue: AuthContextType = {
    session: null,
    user: null,
    loading: true,
    signUp: async () => ({ error: null }),
    signIn: async () => ({ error: null }),
    signOut: async () => ({ error: null }),
};

const AuthContext = createContext<AuthContextType>(defaultContextValue);

export const useAuth = () => {
    return useContext(AuthContext);
};

// Definir el tipo para las props del proveedor
interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // La función `supabase.auth.getSession()` devuelve Session | null
        supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
            setSession(currentSession);
            setLoading(false);
        });

        // Suscribirse a los cambios de Auth
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, currentSession) => {
                setSession(currentSession);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const value: AuthContextType = {
        session,
        user: session?.user as AppUser | null, // Casteamos el tipo de usuario
        loading,
        signUp: async (data) => {
            const { error } = await supabase.auth.signUp(data);
            return { error };
        },
        signIn: async (data) => {
            const { error } = await supabase.auth.signInWithPassword(data);
            return { error };
        },
        signOut: async () => {
            const { error } = await supabase.auth.signOut();
            return { error };
        },
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};