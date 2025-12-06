import { IncomingMessage, ServerResponse } from "http";
import { getSupabase, createAdminClient } from "./supabase-client";

const readBody = (req: IncomingMessage): Promise<any> => {
    return new Promise((resolve, reject) => {
        let body = "";
        req.on("data", (chunk) => {
            body += chunk.toString();
        });
        req.on("end", () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (e) {
                reject(e);
            }
        });
        req.on("error", reject);
    });
};

export const handler = async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const action = url.searchParams.get("action");

    res.setHeader("Content-Type", "application/json");

    try {
        if (req.method === "POST") {
            const body = await readBody(req);

            if (action === "signup") {
                const { email, password, options } = body;
                const { data, error } = await getSupabase().auth.signUp({
                    email,
                    password,
                    options,
                });
                if (error) throw error;
                res.end(JSON.stringify(data));
                return;
            }

            if (action === "signin") {
                const { email, password } = body;
                const { data, error } = await getSupabase().auth
                    .signInWithPassword({
                        email,
                        password,
                    });
                if (error) throw error;
                res.end(JSON.stringify(data));
                return;
            }

            if (action === "signout") {
                const { error } = await getSupabase().auth.signOut();
                if (error) throw error;
                res.end(JSON.stringify({ success: true }));
                return;
            }

            if (action === "oauth") {
                const { provider, options } = body;
                const { data, error } = await getSupabase().auth
                    .signInWithOAuth({
                        provider,
                        options,
                    });
                if (error) throw error;
                res.end(JSON.stringify(data));
                return;
            }

            if (action === "update-user") {
                const authHeader = req.headers.authorization;
                const token = authHeader?.split(" ")[1];
                if (!token) {
                    res.statusCode = 401;
                    res.end(JSON.stringify({ error: "Unauthorized" }));
                    return;
                }

                const { data: updates } = body;

                // 1. Verify user and get ID
                const { data: { user }, error: userError } = await getSupabase().auth.getUser(token);
                if (userError || !user) {
                    res.statusCode = 401;
                    res.end(JSON.stringify({ error: "Invalid token" }));
                    return;
                }

                // 2. Update user using Admin API (updateUserById) since we have service role
                // Note: getSupabase() usually returns a client with ANNON_KEY
                // We must use createAdminClient() to get SERVICE_ROLE_KEY access
                const { data, error } = await createAdminClient().auth.admin.updateUserById(
                    user.id,
                    { user_metadata: updates }
                );

                if (error) throw error;
                res.end(JSON.stringify(data));
                return;
            }
        }

        if (req.method === "GET") {
            if (action === "user") {
                const authHeader = req.headers.authorization;
                const token = authHeader?.split(" ")[1];
                if (!token) {
                    res.statusCode = 401;
                    res.end(JSON.stringify({ error: "Unauthorized" }));
                    return;
                }
                const { data: { user }, error } = await getSupabase().auth
                    .getUser(
                        token,
                    );
                if (error) throw error;
                res.end(JSON.stringify(user));
                return;
            }
            if (action === "session") {
                // This is tricky. The backend doesn't hold the session state for the user
                // unless we use cookies. The frontend Supabase client managed this.
                // If we move to API-only, the frontend needs to store the token
                // and send it with requests.
                // For "get session", the frontend usually checks local storage.
                // If we want to verify a token, we can do `supabase.auth.getUser(token)`.
            }
        }

        res.statusCode = 400;
        res.end(JSON.stringify({ error: "Invalid action" }));
    } catch (error: any) {
        console.error("Auth API Error:", error);
        res.statusCode = 400;
        res.end(JSON.stringify({ error: error.message }));
    }
};
