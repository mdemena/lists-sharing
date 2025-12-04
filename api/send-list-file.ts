import type { IncomingMessage, ServerResponse } from "http";

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

interface SendListFileRequest {
    recipientEmail: string;
    subject: string;
    htmlContent: string;
    attachment: {
        name: string;
        content: string; // Base64 content
    };
    senderEmail?: string;
}

export async function handler(req: IncomingMessage, res: ServerResponse) {
    // Configuración desde variables de entorno (leídas en runtime)
    const BREVO_API_KEY = process.env.VITE_BREVO_API_KEY || "";
    const SENDER_EMAIL = process.env.VITE_SENDER_EMAIL || "it@mdemena.com";

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
        const body: SendListFileRequest = await readBody(req);
        const {
            recipientEmail,
            subject,
            htmlContent,
            attachment,
            senderEmail,
        } = body;

        // Validar campos requeridos
        if (
            !recipientEmail || !subject || !htmlContent || !attachment ||
            !attachment.name || !attachment.content
        ) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Missing required fields" }));
            return;
        }

        // Preparar payload de Brevo
        const brevoPayload = {
            sender: {
                email: senderEmail || SENDER_EMAIL,
                name: "Lists Sharing App",
            },
            to: [{ email: recipientEmail }],
            subject: subject,
            htmlContent: htmlContent,
            attachment: [
                {
                    name: attachment.name,
                    content: attachment.content,
                },
            ],
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

        console.log(`✅ Email sent to ${recipientEmail}`);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            message: "Email enviado correctamente.",
            messageId: brevoData.messageId,
        }));
    } catch (error: any) {
        console.error("Email sending failed:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            error: "Failed to send email",
            details: error.message,
        }));
    }
}
