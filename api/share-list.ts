// api/share-list.ts
import type { IncomingMessage, ServerResponse } from "http";
import { createClient } from "@supabase/supabase-js";

// Helper para leer el body de la request
async function readBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
        let body = "";
        req.on("data", (chunk) => body += chunk.toString());
        req.on("end", () => {
            try {
                resolve(JSON.parse(body));
            } catch (e) {
                reject(e);
            }
        });
        req.on("error", reject);
    });
}

// Configuración desde variables de entorno
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

interface ShareListRequest {
    recipientEmails: string[];
    listName: string;
    listId: string;
    senderEmail: string;
}

export async function handler(req: IncomingMessage, res: ServerResponse) {
    // Configuración desde variables de entorno (leídas en runtime)
    const BREVO_API_KEY = process.env.VITE_BREVO_API_KEY || "";
    const CLIENT_URL = process.env.VITE_CLIENT_URL || "http://localhost:5173";
    const SENDER_EMAIL = process.env.VITE_SENDER_EMAIL || "it@mdemena.com";
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
    const SUPABASE_SERVICE_ROLE_KEY =
        process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "";

    // Cliente de Supabase
    const supabaseAdmin = createClient(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        },
    );

    // Solo permitir POST
    if (req.method !== "POST") {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
        return;
    }

    try {
        // Validar API key de Brevo
        if (!BREVO_API_KEY) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(
                JSON.stringify({ error: "BREVO_API_KEY is not configured" }),
            );
            return;
        }

        // Leer el body
        const body: ShareListRequest = await readBody(req);
        const { recipientEmails, listName, listId, senderEmail } = body;

        // Validar campos requeridos
        if (!recipientEmails || !listName || !listId || !senderEmail) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Missing required fields" }));
            return;
        }

        if (!Array.isArray(recipientEmails) || recipientEmails.length === 0) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(
                JSON.stringify({
                    error: "recipientEmails must be a non-empty array",
                }),
            );
            return;
        }

        // Obtener usuario del header de autorización
        const authHeader = req.headers.authorization;
        let userId: string | null = null;
        let senderDisplayName: string = senderEmail; // Default to email if no display name

        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.replace("Bearer ", "");
            try {
                const { data: { user }, error } = await supabaseAdmin.auth
                    .getUser(token);
                if (user && !error) {
                    userId = user.id;
                    // Get display_name from user metadata
                    senderDisplayName = user.user_metadata?.display_name ||
                        senderEmail;
                }
            } catch (err) {
                console.warn("Error validating token:", err);
            }
        }

        // Insertar shares en la base de datos
        const sharesToInsert = recipientEmails.map((email: string) => ({
            list_id: listId,
            email: email.toLowerCase().trim(),
            shared_by: userId,
        }));

        const { error: dbError } = await supabaseAdmin
            .from("list_shares")
            .upsert(sharesToInsert, {
                onConflict: "list_id,email",
                ignoreDuplicates: true,
            });

        if (dbError) {
            console.error("Error inserting shares:", dbError);
        }

        // Preparar contenido del email
        const shareLink = `${CLIENT_URL}/share/${listId}`;
        const subject =
            `¡Te han invitado a colaborar en una lista: ${listName}!`;

        const htmlContent = `
            <h1>¡Tienes una nueva invitación!</h1>
            <p>Hola,</p>
            <p>${senderDisplayName} te ha invitado a ver y colaborar en la lista de: <strong>${listName}</strong>.</p>
            <p>Haz clic en el enlace para acceder y adjudicar elementos. Deberás registrarte si no tienes cuenta.</p>
            <p><a href="${shareLink}" style="display: inline-block; padding: 12px 24px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">Ver la lista compartida aquí</a></p>
            <br/>
            <p>¡Feliz planificación!</p>
        `;

        // Preparar payload de Brevo
        const brevoPayload = {
            sender: {
                email: SENDER_EMAIL,
                name: `Lista de ${listName}`,
            },
            to: recipientEmails.map((email: string) => ({ email })),
            subject: subject,
            htmlContent: htmlContent,
            headers: {
                "X-Mailer": "Lists Sharing App / Brevo",
            },
        };

        // Enviar email vía Brevo
        const brevoResponse = await fetch(BREVO_API_URL, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "api-key": BREVO_API_KEY,
            },
            body: JSON.stringify(brevoPayload),
        });

        if (!brevoResponse.ok) {
            const errorText = await brevoResponse.text();
            console.error("Brevo API error:", brevoResponse.status, errorText);
            throw new Error(
                `Brevo API returned status ${brevoResponse.status}`,
            );
        }

        const brevoData = await brevoResponse.json() as { messageId?: string };

        console.log(`✅ Emails sent to ${recipientEmails.length} recipients`);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            message:
                `Emails enviados a ${recipientEmails.length} destinatarios vía Brevo.`,
            messageId: brevoData.messageId,
        }));
    } catch (error: any) {
        console.error("Email sending failed:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            error: "Failed to send emails",
            details: error.message,
        }));
    }
}
