import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/client'
import { WhatsAppAssistant } from '@/lib/whatsapp/assistant'
import { requireAdmin } from '@/lib/api-auth'

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin(request)
  if (error) return error

  try {
    const body = await request.json()
    const from = (body.from || '').toString().trim()
    const text = (body.text || '').toString().trim()

    if (!from || !text) {
      return NextResponse.json({ success: false, message: 'Missing from or text' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const assistant = new WhatsAppAssistant(supabase)
    const response = await assistant.handleMessage(from, text)

    return NextResponse.json({ success: true, response })
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'WhatsApp test failed' }, { status: 500 })
  }
}
