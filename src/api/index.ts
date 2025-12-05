import axios from "axios";
import type {
    SignInWithPasswordCredentials,
    SignUpWithPasswordCredentials,
} from "@supabase/supabase-js";

const API_URL = "/api";

// Helper to get token (we'll store it in localStorage)
const getToken = () => localStorage.getItem("sb-access-token");
const setToken = (token: string | null) => {
    if (token) localStorage.setItem("sb-access-token", token);
    else localStorage.removeItem("sb-access-token");
};

// Axios instance
const client = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Interceptor to add token
client.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const api = {
    auth: {
        signUp: async (credentials: SignUpWithPasswordCredentials) => {
            try {
                const response = await client.post(
                    "/auth?action=signup",
                    credentials,
                );
                const { session, user } = response.data;
                if (session) setToken(session.access_token);
                return { data: { user, session }, error: null };
            } catch (error: any) {
                return {
                    data: { user: null, session: null },
                    error: error.response?.data?.error || error.message,
                };
            }
        },
        signInWithPassword: async (
            credentials: SignInWithPasswordCredentials,
        ) => {
            try {
                const response = await client.post(
                    "/auth?action=signin",
                    credentials,
                );
                const { session, user } = response.data;
                if (session) setToken(session.access_token);
                return { data: { user, session }, error: null };
            } catch (error: any) {
                return {
                    data: { user: null, session: null },
                    error: error.response?.data?.error || error.message,
                };
            }
        },
        signOut: async () => {
            try {
                await client.post("/auth?action=signout");
                setToken(null);
                return { error: null };
            } catch (error: any) {
                return { error: error.response?.data?.error || error.message };
            }
        },
        getSession: async () => {
            // Since we are stateless, we rely on the token.
            // We can validate the token by making a request to the backend or just return it if present.
            // For now, let's just check if we have a token.
            // Ideally, we should have an endpoint to validate the session.
            const token = getToken();
            if (!token) return { data: { session: null }, error: null };

            // We can decode the token to get the user, or just return a dummy session structure
            // that the app expects. The app mainly uses `user.id`.
            // Let's try to get the user from the backend to validate.
            // We'll add a 'me' endpoint or similar, or just use the token.
            // For now, let's assume if token exists, session is valid (optimistic).
            // But we need the user object.
            // Let's add a `getUser` method to our API client that calls an endpoint.
            // But `getSession` is sync in Supabase usually? No, it's async.

            // Let's implement a simple `getUser` in `api/auth.ts` later if needed.
            // For now, let's return null if no token.
            return { data: { session: { access_token: token } }, error: null };
        },
        getUser: async () => {
            // We need an endpoint to get the user details from the token.
            // Let's assume we can call `api/auth?action=user` (we need to implement this).
            // Or we can just decode the JWT on the frontend.
            // For simplicity in this migration, let's try to decode the JWT if possible,
            // or add a `user` action to `api/auth.ts`.
            // Let's add `user` action to `api/auth.ts`.
            try {
                // We haven't implemented `user` action yet.
                // Let's implement it in the next step.
                const response = await client.get("/auth?action=user");
                return { data: { user: response.data }, error: null };
            } catch (error: any) {
                return {
                    data: { user: null },
                    error: error.response?.data?.error || error.message,
                };
            }
        },
        signInWithOAuth: async (
            provider: "google" | "github",
            options?: any,
        ) => {
            try {
                const response = await client.post("/auth?action=oauth", {
                    provider,
                    options,
                });
                return { data: response.data, error: null };
            } catch (error: any) {
                return {
                    data: null,
                    error: error.response?.data?.error || error.message,
                };
            }
        },
    },
    lists: {
        list: async () => {
            const response = await client.get("/lists");
            return { data: response.data, error: null };
        },
        create: async (list: any) => {
            const response = await client.post("/lists", list);
            return { data: response.data, error: null };
        },
        get: async (id: string) => {
            const response = await client.get(`/lists?id=${id}`);
            return { data: response.data, error: null };
        },
        getShares: async (listId: string) => {
            const response = await client.get(
                `/lists?action=shares&listId=${listId}`,
            );
            return { data: response.data, error: null };
        },
        shareList: async (data: any) => {
            try {
                const response = await client.post("/share-list", data);
                return { data: response.data, error: null };
            } catch (error: any) {
                return {
                    data: null,
                    error: error.response?.data?.error || error.message,
                };
            }
        },
        registerUserToList: async (listId: string) => {
            try {
                const response = await client.get(
                    `/lists?action=register-user&listId=${listId}`,
                );
                return { data: response.data, error: null };
            } catch (error: any) {
                return {
                    data: null,
                    error: error.response?.data?.error || error.message,
                };
            }
        },
        getSharedWithMe: async () => {
            try {
                const response = await client.get(
                    "/lists?action=my-shared-lists",
                );
                return { data: response.data, error: null };
            } catch (error: any) {
                return {
                    data: null,
                    error: error.response?.data?.error || error.message,
                };
            }
        },
        delete: async (id: string) => {
            try {
                await client.delete(`/lists?id=${id}`);
                return { error: null };
            } catch (error: any) {
                return {
                    error: error.response?.data?.error || error.message,
                };
            }
        },
        sendListFile: async (data: any) => {
            try {
                const response = await client.post("/send-list-file", data);
                return { data: response.data, error: null };
            } catch (error: any) {
                return {
                    data: null,
                    error: error.response?.data?.error || error.message,
                };
            }
        },
    },
    items: {
        list: async (listId: string) => {
            const response = await client.get(`/items?listId=${listId}`);
            return { data: response.data, error: null };
        },
        create: async (item: any) => {
            const response = await client.post("/items", item);
            return { data: response.data, error: null };
        },
        update: async (itemId: string, updates: any) => {
            const response = await client.put(
                `/items?itemId=${itemId}`,
                updates,
            );
            return { data: response.data, error: null };
        },
        delete: async (itemId: string) => {
            await client.delete(`/items?itemId=${itemId}`);
            return { error: null };
        },
        adjudicate: async (itemId: string, adjudicate: boolean) => {
            try {
                const response = await client.put(`/items?itemId=${itemId}`, {
                    is_adjudicated: adjudicate,
                    adjudicated_by: adjudicate ? "current_user" : null, // Backend will use actual user
                    adjudicated_at: adjudicate
                        ? new Date().toISOString()
                        : null,
                });
                return { data: response.data, error: null };
            } catch (error: any) {
                return {
                    data: null,
                    error: error.response?.data?.error || error.message,
                };
            }
        },
    },
    profiles: {
        get: async (id: string) => {
            const response = await client.get(`/profiles?id=${id}`);
            return { data: response.data, error: null };
        },
        upsert: async (updates: any) => {
            await client.post("/profiles", updates);
            return { error: null };
        },
    },
};
