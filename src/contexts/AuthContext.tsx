// frontend/src/contexts/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type Session, AuthError, type SignInWithPasswordCredentials, type SignUpWithPasswordCredentials } from '@supabase/supabase-js';
import { api } from '../api';
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
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initSession = async () => {
            // First, check if we're coming back from an OAuth redirect
            // Supabase sends tokens in the URL hash like: #access_token=...&refresh_token=...
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');
            
            if (accessToken) {
                // We have tokens from OAuth callback
                // Store them in localStorage
                localStorage.setItem('sb-access-token', accessToken);
                if (refreshToken) {
                    localStorage.setItem('sb-refresh-token', refreshToken);
                }
                
                // Clean up the URL hash
                window.history.replaceState(null, '', window.location.pathname);
                
                // Get user details with the new token
                const { data: { user: currentUser }, error } = await api.auth.getUser();
                if (!error && currentUser) {
                    const newSession = {
                        access_token: accessToken,
                        refresh_token: refreshToken,
                        user: currentUser
                    } as Session;
                    setSession(newSession);
                    setUser(currentUser as AppUser);
                } else {
                    console.error('Error getting user after OAuth:', error);
                    setSession(null);
                    setUser(null);
                }
            } else {
                // No OAuth tokens in URL, check localStorage for existing session
                const { data: { session: currentSession } } = await api.auth.getSession();
                if (currentSession?.access_token) {
                     // If we have a token, try to get the user details
                     const { data: { user: currentUser }, error } = await api.auth.getUser();
                     if (!error && currentUser) {
                         setSession({ ...currentSession, user: currentUser } as Session);
                         setUser(currentUser as AppUser);
                     } else {
                         // Invalid token or error
                         setSession(null);
                         setUser(null);
                     }
                } else {
                    setSession(null);
                    setUser(null);
                }
            }
            setLoading(false);
        };
        initSession();
    }, []);

    const value: AuthContextType = {
        session,
        user,
        loading,
        signUp: async (data) => {
            const { data: result, error } = await api.auth.signUp(data);
            if (result.session) {
                setSession(result.session);
                setUser(result.user as AppUser);
            }
            return { error: error ? { message: error } as AuthError : null };
        },
        signIn: async (data) => {
            const { data: result, error } = await api.auth.signInWithPassword(data);
            if (result.session) {
                setSession(result.session);
                setUser(result.user as AppUser);
            }
            return { error: error ? { message: error } as AuthError : null };
        },
        signOut: async () => {
            const { error } = await api.auth.signOut();
            setSession(null);
            setUser(null);
            return { error: error ? { message: error } as AuthError : null };
        },
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};