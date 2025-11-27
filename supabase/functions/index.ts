import { corsHeaders } from './_shared/cors'

export const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    // Responder a la preflight request
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Tu lógica principal aquí
    const data = { message: 'Función ejecutada correctamente' }

    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })
  }
}

export default handler
