import { NextRequest, NextResponse } from 'next/server'
import { WhatsAppAssistant } from '@/lib/whatsapp/assistant'
import { hasWhatsAppConfig, sendWhatsAppMessage } from '@/lib/whatsapp/client'

const assistant = new WhatsAppAssistant()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Handle WhatsApp Webhook verification
    if (body.mode === 'subscribe' && body.token) {
      if (body.token === process.env.WHATSAPP_VERIFY_TOKEN) {
        return NextResponse.json({ challenge: body.challenge })
      }
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
    }

    // Process incoming message
    const entry = body.entry?.[0]
    const change = entry?.changes?.[0]
    const message = change?.value?.messages?.[0]

    if (!message) {
      return NextResponse.json({ status: 'no message' })
    }

    const from = message.from
    const text = message.text?.body || ''

    const response = await assistant.handleMessage(from, text)

    if (hasWhatsAppConfig()) {
      try {
        await sendWhatsAppMessage(from, response)
      } catch (sendError) {
        console.error('WhatsApp send failed:', sendError)
      }
    } else {
      console.log('[WhatsApp] Outbound disabled; received message processed only')
    }

    return NextResponse.json({ status: 'processed' })
  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return NextResponse.json(parseInt(challenge || '0'))
  }

  return NextResponse.json({ error: 'Invalid verification' }, { status: 403 })
}
