const RESEND_URL = 'https://api.resend.com/emails'

export async function POST(request: Request) {
  const data = await request.json()
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.CONTACT_TO

  // Sin credenciales (desarrollo): solo se registra la consulta en consola.
  if (!apiKey || !to) {
    console.log('CONSULTA', data)
    return Response.json({ok: true})
  }

  const response = await fetch(RESEND_URL, {
    method: 'POST',
    headers: {Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({
      from: 'ZETA <onboarding@resend.dev>',
      to,
      subject: `Consulta — ${data.tipo} — ${data.nombre}`,
      text: Object.entries(data)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n'),
    }),
  })

  return Response.json({ok: response.ok}, {status: response.ok ? 200 : 502})
}
