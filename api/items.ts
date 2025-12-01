import { IncomingMessage, ServerResponse } from "http";
import { createAuthClient } from "./supabase-client";

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
    res.setHeader("Content-Type", "application/json");

    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    // Some operations might be public (viewing a shared list?),
    // but the original code uses `supabase` client which usually has the anon key.
    // If the user is not logged in, `user` is null.
    // If we want to support public access (e.g. shared lists), we might need to allow
    // requests without a token (using just the anon client).
    // However, `ListView.tsx` checks `user` for some actions.
    // Reading a list: `supabase.from('list_items').select('*').eq('list_id', listId)`
    // This should work with just the anon key if RLS allows it.

    let supabase;
    if (token) {
        supabase = createAuthClient(token);
    } else {
        // Fallback to anon client for public access
        const { getSupabase } = await import("./supabase-client");
        supabase = getSupabase();
    }

    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const listId = url.searchParams.get("listId");
    const itemId = url.searchParams.get("itemId");

    try {
        if (req.method === "GET") {
            if (listId) {
                const { data, error } = await supabase
                    .from("list_items")
                    .select("*")
                    .eq("list_id", listId)
                    .order("importance", { ascending: false });

                if (error) throw error;
                res.end(JSON.stringify(data));
                return;
            }
        }

        if (req.method === "POST") {
            const body = await readBody(req);
            const { data, error } = await supabase
                .from("list_items")
                .insert(body)
                .select()
                .single();

            if (error) throw error;
            res.end(JSON.stringify(data));
            return;
        }

        if (req.method === "PUT") {
            const body = await readBody(req);
            if (!itemId) throw new Error("Item ID required for update");

            const { data, error } = await supabase
                .from("list_items")
                .update(body)
                .eq("id", itemId)
                .select()
                .single();

            if (error) throw error;
            res.end(JSON.stringify(data));
            return;
        }

        if (req.method === "DELETE") {
            if (!itemId) throw new Error("Item ID required for delete");

            const { error } = await supabase
                .from("list_items")
                .delete()
                .eq("id", itemId);

            if (error) throw error;
            res.end(JSON.stringify({ success: true }));
            return;
        }

        res.statusCode = 405;
        res.end(JSON.stringify({ error: "Method not allowed" }));
    } catch (error: any) {
        console.error("Items API Error:", error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: error.message }));
    }
};
