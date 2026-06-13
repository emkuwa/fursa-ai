export const WHATSAPP_API_BASE = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v17.0'
export const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || ''
export const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || ''

export function hasWhatsAppConfig() {
  return Boolean(WHATSAPP_ACCESS_TOKEN && WHATSAPP_PHONE_NUMBER_ID)
}

export async function sendWhatsAppMessage(to: string, body: string) {
  if (!hasWhatsAppConfig()) {
    throw new Error('WhatsApp API is not configured')
  }

  const response = await fetch(`${WHATSAPP_API_BASE}/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: {
        body,
      },
    }),
  })

  if (!response.ok) {
    const payload = await response.text()
    throw new Error(`WhatsApp API send failed (${response.status}): ${payload}`)
  }

  return response.json()
}

export async function verifyWhatsAppConfig() {
  if (!hasWhatsAppConfig()) {
    return { ok: false, message: 'WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID is missing' }
  }

  const response = await fetch(`${WHATSAPP_API_BASE}/${WHATSAPP_PHONE_NUMBER_ID}?fields=whatsapp_business_account`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
    },
  })

  return {
    ok: response.ok,
    status: response.status,
    message: response.ok ? 'WhatsApp API credentials appear valid' : `WhatsApp config check failed: ${await response.text()}`,
  }
}
