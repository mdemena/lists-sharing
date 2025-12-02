import { IncomingMessage, ServerResponse } from "http";
import { createAdminClient, createAuthClient } from "./supabase-client";

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

    // Get the access token from the Authorization header
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
            if (id) {
                // Get single list
                const { data, error } = await supabase
                    .from("lists")
                    .select("*, list_shares(count)")
                    .eq("id", id)
                    .single();

                if (error) throw error;
                res.end(JSON.stringify(data));
            } else if (url.searchParams.get("action") === "shares") {
                const listId = url.searchParams.get("listId");
                if (!listId) throw new Error("List ID required");

                const { data, error } = await supabase
                    .rpc("get_list_shares_with_status", { p_list_id: listId });

                if (error) throw error;
                res.end(JSON.stringify(data));
            } else if (url.searchParams.get("action") === "register-user") {
                // Auto-register authenticated user to a shared list
                const listId = url.searchParams.get("listId");
                if (!listId) throw new Error("List ID required");

                const { data: { user }, error: userError } = await supabase.auth
                    .getUser();
                if (userError || !user) {
                    throw userError || new Error("User not found");
                }

                // Get user's email
                const userEmail = user.email;
                if (!userEmail) {
                    throw new Error("User email not found");
                }

                // Update list_shares to set user_id for this email and list
                // Use admin client to bypass RLS for this specific operation
                const supabaseAdmin = createAdminClient();

                // 1. Fetch list to get owner_id
                const { data: listData, error: listError } = await supabaseAdmin
                    .from("lists")
                    .select("owner_id")
                    .eq("id", listId)
                    .single();

                if (listError || !listData) {
                    throw new Error(
                        "List not found or error fetching list details",
                    );
                }

                // 2. Upsert share with shared_by = owner_id
                const { data, error } = await supabaseAdmin
                    .from("list_shares")
                    .upsert({
                        list_id: listId,
                        email: userEmail.toLowerCase().trim(),
                        user_id: user.id,
                        shared_by: listData.owner_id, // Set shared_by to list owner
                    }, {
                        onConflict: "list_id,email",
                    })
                    .select()
                    .single();

                if (error) throw error;
                res.end(JSON.stringify(data));
            } else if (url.searchParams.get("action") === "my-shared-lists") {
                // Get lists shared with the authenticated user
                const { data: { user }, error: userError } = await supabase.auth
                    .getUser();
                if (userError || !user) {
                    throw userError || new Error("User not found");
                }

                // Auto-claim any pending shares for this email (where user_id is null)
                const userEmail = user.email;
                if (userEmail) {
                    const supabaseAdmin = createAdminClient();
                    await supabaseAdmin
                        .from("list_shares")
                        .update({ user_id: user.id })
                        .eq("email", userEmail.toLowerCase().trim())
                        .is("user_id", null);
                }

                // Query list_shares where user_id matches, then join with lists and shared_by profile
                const { data, error } = await supabase
                    .from("list_shares")
                    .select(`
                        list_id, 
                        lists(*),
                        shared_by_profile:profiles!list_shares_shared_by_fkey(display_name, email)
                    `)
                    .eq("user_id", user.id);

                if (error) throw error;

                // Extract the lists and add shared_by info
                const sharedLists = data?.map((share: any) => ({
                    ...share.lists,
                    shared_by_name: share.shared_by_profile?.display_name ||
                        share.shared_by_profile?.email || "Usuario desconocido",
                })).filter(Boolean) || [];
                res.end(JSON.stringify(sharedLists));
            } else {
                // Get all lists for user (RLS handles filtering by owner_id usually,
                // but we can also be explicit if needed. The original code used .eq('owner_id', user.id))
                // With RLS and auth token, .select() should return user's lists.
                // However, the original code explicitly filtered by owner_id.
                // We can get the user from the token to be safe, or trust RLS.
                // Let's trust RLS + explicit filter if we can get user ID,
                // but getting user ID from token requires an extra call or decoding.
                // For now, let's just select.

                // Wait, the original code: .eq('owner_id', user.id)
                // We can get the user from the token:
                const { data: { user }, error: userError } = await supabase.auth
                    .getUser();
                if (userError || !user) {
                    throw userError || new Error("User not found");
                }

                const { data, error } = await supabase
                    .from("lists")
                    .select("*, list_shares(count)")
                    .eq("owner_id", user.id)
                    .order("created_at", { ascending: false });

                if (error) throw error;
                res.end(JSON.stringify(data));
            }
            return;
        }

        if (req.method === "POST") {
            const body = await readBody(req);
            // Body should contain: name, description, owner_id (optional if we set it here)
            // We should set owner_id from the authenticated user to be safe.
            const { data: { user }, error: userError } = await supabase.auth
                .getUser();
            if (userError || !user) {
                throw userError || new Error("User not found");
            }

            const { data, error } = await supabase
                .from("lists")
                .insert({
                    ...body,
                    owner_id: user.id,
                })
                .select()
                .single();

            if (error) throw error;
            res.end(JSON.stringify(data));
            return;
        }

        // Add PUT/DELETE if needed, though Dashboard.tsx mainly does GET and POST for lists.
        // Dashboard.tsx doesn't seem to have DELETE/UPDATE for lists directly shown in the snippets,
        // but it's good practice to have them or add them when needed.
        // The original code shows `handleCreateList` (POST) and `fetchUserLists` (GET).
        // `ListView.tsx` fetches a single list (GET).

        res.statusCode = 405;
        res.end(JSON.stringify({ error: "Method not allowed" }));
    } catch (error: any) {
        console.error("Lists API Error:", error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: error.message }));
    }
};
