import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/client'
import { verifyResendApiKey } from '@/lib/email/resend'
import { verifyWhatsAppConfig } from '@/lib/whatsapp/client'
import { requireAdmin } from '@/lib/api-auth'

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'
const OPENROUTER_API_URL = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/v1/chat/completions'
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'gpt-4o-mini'

async function checkDatabase() {
  const supabase = createServiceClient()
  const [opportunityRes, sourceRes, healthRes] = await Promise.all([
    supabase.from('opportunities').select('id').limit(1),
    supabase.from('sources').select('id').limit(1),
    supabase.from('source_health').select('status').limit(1),
  ])

  return {
    ok: !opportunityRes.error && !sourceRes.error && !healthRes.error,
    errors: [opportunityRes.error, sourceRes.error, healthRes.error].filter(Boolean).map((error) => error?.message),
  }
}

async function checkSearch() {
  const supabase = createServiceClient()
  const { error } = await supabase.from('opportunities').select('id').limit(1)
  return { ok: !error, error: error?.message }
}

async function checkStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return { ok: false, message: 'STRIPE_SECRET_KEY is not configured' }
  }

  try {
    const stripe = new Stripe(secretKey, { apiVersion: '2026-05-27.dahlia' })
    const prices = await stripe.prices.list({ limit: 1 })
    return { ok: true, message: `Stripe test query succeeded (${prices.data.length} prices returned)` }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Stripe connectivity failed' }
  }
}

async function checkAIProvider() {
  const deepseekKey = process.env.DEEPSEEK_API_KEY
  const openrouterKey = process.env.OPENROUTER_API_KEY
  const hasDeepSeek = Boolean(deepseekKey)
  const hasOpenRouter = Boolean(openrouterKey)

  if (!hasDeepSeek && !hasOpenRouter) {
    return { ok: false, provider: null, message: 'No AI provider configured. Set DEEPSEEK_API_KEY or OPENROUTER_API_KEY.' }
  }

  const provider = hasDeepSeek ? 'DeepSeek' : 'OpenRouter'
  const url = hasDeepSeek ? DEEPSEEK_API_URL : OPENROUTER_API_URL
  const apiKey = hasDeepSeek ? deepseekKey : openrouterKey
  const model = hasDeepSeek ? 'deepseek-chat' : OPENROUTER_MODEL

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'Health check: respond with OK in one word.' },
          { role: 'user', content: 'Ping' },
        ],
        max_tokens: 1,
        temperature: 0,
      }),
    })

    if (!response.ok) {
      const payload = await response.text()
      return { ok: false, provider, message: `AI provider check failed (${response.status}): ${payload}` }
    }

    return { ok: true, provider, message: 'AI provider is reachable' }
  } catch (error) {
    return { ok: false, provider, message: error instanceof Error ? error.message : 'AI provider connectivity failed' }
  }
}

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin(request)
  if (error) return error
  const [database, search, stripe, ai, email, whatsapp] = await Promise.all([
    checkDatabase(),
    checkSearch(),
    checkStripe(),
    checkAIProvider(),
    verifyResendApiKey(),
    verifyWhatsAppConfig(),
  ])

  const healthy = [database.ok, search.ok, stripe.ok, ai.ok, email.ok, whatsapp.ok].every(Boolean)

  return NextResponse.json({
    success: healthy,
    data: {
      database,
      search,
      ai,
      stripe,
      email,
      whatsapp,
      runtime: { timestamp: new Date().toISOString() },
    },
    overall_status: healthy ? 'healthy' : 'degraded',
  })
}
