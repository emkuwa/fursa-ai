const RESEND_API_URL = 'https://api.resend.com/emails'
const RESEND_DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || 'no-reply@fursaai.com'

export interface SendResendEmailParams {
  to: string
  subject: string
  html: string
  text: string
}

export async function sendResendEmail({ to, subject, html, text }: SendResendEmailParams) {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: RESEND_DEFAULT_FROM,
      to,
      subject,
      html,
      text,
    }),
  })

  if (!response.ok) {
    const payload = await response.text()
    throw new Error(`Resend email failed (${response.status}): ${payload}`)
  }

  return response.json()
}

export async function verifyResendApiKey() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { ok: false, message: 'RESEND_API_KEY is not configured' }
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })

  return {
    ok: response.ok,
    status: response.status,
    message: response.ok ? 'Resend API key is valid' : `Resend API verification failed: ${await response.text()}`,
  }
}

export function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY)
}
