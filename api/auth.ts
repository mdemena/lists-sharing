import { IncomingMessage, ServerResponse } from "http";
import { getSupabase } from "./supabase-client";

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
                // const { data: userData } = body;
                // Note: Updating user usually requires a valid session.
                // Since we are stateless here, we might need to pass the access token
                // or handle it differently. For now, let's assume the client passes
                // the access token in headers if needed, but supabase-js client
                // on backend is admin/service role or anon.
                // Actually, `supabase.auth.updateUser` works on the *current* session.
                // Without passing the user's JWT to the backend client, we can't update *their* user.
                // We might need to create a client *with* the user's token for this request.

                // For this MVP migration, let's see if we can just forward the token.
                // But `supabase-client.ts` creates a static client.
                // We'll need to handle this. For now, basic auth flows.
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
