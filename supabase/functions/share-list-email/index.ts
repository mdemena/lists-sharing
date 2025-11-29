// supabase/functions/share-list-email/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Brevo API base URL
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

// Claves obtenidas de los secretos de Supabase
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const CLIENT_URL = Deno.env.get("CLIENT_URL") ||
    "https://lists-sharing.mdemena.com";
const SENDER_EMAIL = Deno.env.get("SENDER_EMAIL") || "it@mdemena.com"; // Definir un email de remitente verificado en Brevo
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
        });
    }

    if (!BREVO_API_KEY) {
        return new Response(
            JSON.stringify({ error: "BREVO_API_KEY is not set." }),
            { status: 500 },
        );
    }

    try {
        const { recipientEmails, listName, listId, senderEmail } = await req
            .json();

        if (!recipientEmails || !listName || !listId || !senderEmail) {
            return new Response(
                JSON.stringify({ error: "Missing required fields" }),
                { status: 400 },
            );
        }

        // Initialize Supabase Admin Client
        const supabaseAdmin = createClient(
            SUPABASE_URL,
            SUPABASE_SERVICE_ROLE_KEY,
        );

        // Insert shares into database
        const sharesToInsert = recipientEmails.map((email: string) => ({
            list_id: listId,
            email: email,
            // We might want to store who shared it, but we need the user ID.
            // For now, let's just store the email and list_id.
            // If we have the user's JWT, we could get the ID, but here we are using admin client.
            // We can pass the sender's ID from the frontend if needed, but the requirement was "registrada con quien la ha compartido".
            // Let's assume for now we just track the share exists.
            // If we want to track 'shared_by', we should pass it from frontend.
            // But wait, the migration has 'shared_by'.
            // Let's try to get the user from the Authorization header if present.
        }));

        // Get user from JWT if available
        const authHeader = req.headers.get("Authorization");
        let userId = null;
        if (authHeader) {
            const token = authHeader.replace("Bearer ", "");
            const { data: { user }, error } = await supabaseAdmin.auth.getUser(
                token,
            );
            if (user) userId = user.id;
        }

        const sharesWithUser = sharesToInsert.map((share: any) => ({
            ...share,
            shared_by: userId,
        }));

        const { error: dbError } = await supabaseAdmin
            .from("list_shares")
            .upsert(sharesWithUser, {
                onConflict: "list_id,email",
                ignoreDuplicates: true,
            });

        if (dbError) {
            console.error("Error inserting shares:", dbError);
            // We continue to send emails even if DB fails? Maybe better to fail?
            // Let's log it but try to send emails.
        }

        const shareLink = `${CLIENT_URL}/share/${listId}`;
        const subject =
            `¡Te han invitado a colaborar en una lista: ${listName}!`;

        // Contenido del email en formato HTML
        const htmlContent = `
      <h1>¡Tienes una nueva invitación!</h1>
      <p>Hola,</p>
      <p>${senderEmail} te ha invitado a ver y colaborar en la lista de: <strong>${listName}</strong>.</p>
      <p>Haz clic en el enlace para acceder y adjudicar elementos. Deberás registrarte si no tienes cuenta.</p>
      <p><a href="${shareLink}">Ver la lista compartida aquí</a></p>
      <br/>
      <p>¡Feliz planificación!</p>
    `;

        // 1. Crear el payload de Brevo
        // Brevo prefiere un único endpoint que maneje varios "to"
        const brevoPayload = {
            sender: {
                email: SENDER_EMAIL, // Email configurado y verificado en Brevo
                name: `Lista de ${listName}`,
            },
            // Array de objetos de destinatarios
            to: recipientEmails.map((email: string) => ({ email })),
            subject: subject,
            htmlContent: htmlContent,
            // Opcional: headers y tags para seguimiento
            headers: {
                "X-Mailer": "Supabase Edge Function / Brevo",
            },
        };

        // 2. Enviar la solicitud a la API de Brevo
        const brevoResponse = await fetch(BREVO_API_URL, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "api-key": BREVO_API_KEY, // La clave de Brevo va en la cabecera
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

        // Respuesta exitosa
        return new Response(
            JSON.stringify({
                message:
                    `Emails enviados a ${recipientEmails.length} destinatarios vía Brevo.`,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
        );
    } catch (error: any) {
        console.error("Email sending failed:", error);
        return new Response(
            JSON.stringify({
                error: `Failed to send emails: ${error.message}`,
            }),
            { status: 500 },
        );
    }
});
