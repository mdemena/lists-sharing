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

    if (!token) {
        res.statusCode = 401;
        res.end(JSON.stringify({ error: "Unauthorized" }));
        return;
    }

    const supabase = createAuthClient(token);
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const id = url.searchParams.get("id");

    try {
        if (req.method === "GET") {
            if (!id) throw new Error("Profile ID required");

            const { data, error } = await supabase
                .from("profiles")
                .select("date_of_birth")
                .eq("id", id)
                .single();

            if (error && error.code !== "PGRST116") throw error;
            res.end(JSON.stringify(data || {}));
            return;
        }

        if (req.method === "POST" || req.method === "PUT") {
            // Upsert profile
            const body = await readBody(req);
            const { error } = await supabase
                .from("profiles")
                .upsert(body);

            if (error) throw error;
            res.end(JSON.stringify({ success: true }));
            return;
        }

        res.statusCode = 405;
        res.end(JSON.stringify({ error: "Method not allowed" }));
    } catch (error: any) {
        console.error("Profiles API Error:", error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: error.message }));
    }
};
