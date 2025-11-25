// supabase/functions/share-list-email/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// Brevo API base URL
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// Claves obtenidas de los secretos de Supabase
const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
const CLIENT_URL = Deno.env.get('CLIENT_URL') || 'http://localhost:3000';
const SENDER_EMAIL = Deno.env.get('SENDER_EMAIL') || 'it@mdemena.com'; // Definir un email de remitente verificado en Brevo

serve(async (req) => {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    if (!BREVO_API_KEY) {
        return new Response(JSON.stringify({ error: 'BREVO_API_KEY is not set.' }), { status: 500 });
    }

    try {
        const { recipientEmails, listName, listId, senderEmail } = await req.json();

        if (!recipientEmails || !listName || !listId || !senderEmail) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
        }

        const shareLink = `${CLIENT_URL}/share/${listId}`;
        const subject = `¡Te han invitado a colaborar en una lista: ${listName}!`;

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
                'X-Mailer': 'Supabase Edge Function / Brevo',
            },
        };

        // 2. Enviar la solicitud a la API de Brevo
        const brevoResponse = await fetch(BREVO_API_URL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'api-key': BREVO_API_KEY, // La clave de Brevo va en la cabecera
            },
            body: JSON.stringify(brevoPayload),
        });

        if (!brevoResponse.ok) {
            const errorText = await brevoResponse.text();
            console.error('Brevo API error:', brevoResponse.status, errorText);
            throw new Error(`Brevo API returned status ${brevoResponse.status}`);
        }

        // Respuesta exitosa
        return new Response(
            JSON.stringify({ message: `Emails enviados a ${recipientEmails.length} destinatarios vía Brevo.` }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Email sending failed:', error);
        return new Response(
            JSON.stringify({ error: `Failed to send emails: ${error.message}` }),
            { status: 500 }
        );
    }
});