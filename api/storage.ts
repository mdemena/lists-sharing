// api/storage.ts
import type { IncomingMessage, ServerResponse } from "http";
import multer from "multer";
import { supabaseAdmin } from "./lib/supabase-admin";

// Configurar multer para almacenamiento en memoria
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});

// Middleware helper para usar multer con promesas y tipos nativos de Node
const runMiddleware = (req: IncomingMessage, res: ServerResponse, fn: any) => {
    return new Promise((resolve, reject) => {
        fn(req, res, (result: any) => {
            if (result instanceof Error) {
                return reject(result);
            }
            return resolve(result);
        });
    });
};

const BUCKET_NAME = "item-images";

// Helper para leer body JSON (para delete)
async function readBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
        let body = "";
        req.on("data", (chunk) => body += chunk.toString());
        req.on("end", () => {
            try {
                if (!body) resolve({});
                else resolve(JSON.parse(body));
            } catch (e) {
                reject(e);
            }
        });
        req.on("error", reject);
    });
}

export async function handler(req: IncomingMessage, res: ServerResponse) {
    // URL parsing
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const action = url.searchParams.get("action");

    // Helper para enviar JSON
    const sendJson = (statusCode: number, data: any) => {
        res.writeHead(statusCode, { "Content-Type": "application/json" });
        res.end(JSON.stringify(data));
    };

    // Verificar autenticación
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return sendJson(401, { error: "Unauthorized" });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
        return sendJson(401, { error: "Invalid token" });
    }

    if (req.method === "POST" && action === "upload") {
        try {
            // Procesar archivo con multer
            await runMiddleware(req, res, upload.single("file"));

            // Multer añade 'file' y 'body' al request, pero IncomingMessage no los tiene tipados
            const file = (req as any).file;
            const body = (req as any).body;

            if (!file) {
                return sendJson(400, { error: "No file uploaded" });
            }

            const { listId, itemId } = body;
            if (!listId) {
                return sendJson(400, { error: "Missing listId" });
            }

            // Generar path: userId/listId/itemId/filename
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 8);
            const extension = file.originalname.split(".").pop() || "jpg";
            const filename = `${timestamp}_${randomString}.${extension}`;
            const itemPath = itemId || "temp";
            const storagePath = `${user.id}/${listId}/${itemPath}/${filename}`;

            // Subir a Supabase Storage
            const { error } = await supabaseAdmin.storage
                .from(BUCKET_NAME)
                .upload(storagePath, file.buffer, {
                    contentType: file.mimetype,
                    cacheControl: "3600",
                    upsert: false,
                });

            if (error) {
                console.error("Supabase storage upload error:", error);
                return sendJson(500, { error: error.message });
            }

            // Obtener URL pública
            const { data: urlData } = supabaseAdmin.storage
                .from(BUCKET_NAME)
                .getPublicUrl(storagePath);

            return sendJson(200, {
                url: urlData.publicUrl,
                path: storagePath,
            });

        } catch (error: any) {
            console.error("Upload error:", error);
            return sendJson(500, { error: error.message || "Upload failed" });
        }
    } else if (req.method === "POST" && action === "delete") {
        try {
            const body = await readBody(req);
            const { path } = body;

            if (!path) {
                return sendJson(400, { error: "Missing path" });
            }

            // Verificar que el usuario es dueño del archivo
            if (!path.startsWith(`${user.id}/`)) {
                return sendJson(403, { error: "Unauthorized to delete this file" });
            }

            const { error } = await supabaseAdmin.storage
                .from(BUCKET_NAME)
                .remove([path]);

            if (error) {
                return sendJson(500, { error: error.message });
            }

            return sendJson(200, { success: true });
        } catch (error: any) {
            return sendJson(500, { error: error.message });
        }
    } else if (req.method === "POST" && action === "delete-multiple") {
        try {
            const body = await readBody(req);
            const { paths } = body;

            if (!paths || !Array.isArray(paths)) {
                return sendJson(400, { error: "Missing paths array" });
            }

            // Verificar ownership
            const unauthorizedPaths = paths.filter((p: string) => !p.startsWith(`${user.id}/`));
            if (unauthorizedPaths.length > 0) {
                return sendJson(403, { error: "Unauthorized to delete some files" });
            }

            const { error } = await supabaseAdmin.storage
                .from(BUCKET_NAME)
                .remove(paths);

            if (error) {
                return sendJson(500, { error: error.message });
            }

            return sendJson(200, { success: true });
        } catch (error: any) {
            return sendJson(500, { error: error.message });
        }
    }

    return sendJson(405, { error: "Method not allowed" });
}
