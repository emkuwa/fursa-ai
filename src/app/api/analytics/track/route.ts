import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const VALID_EVENT_TYPES = [
  'view', 'click', 'save', 'unsave', 'search', 'share',
  'alert_open', 'digest_open', 'referral_click',
  'upgrade_prompt_view', 'upgrade_prompt_click',
] as const

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event_type, opportunity_id, category, country, metadata } = body

    if (!VALID_EVENT_TYPES.includes(event_type)) {
      return NextResponse.json({ success: false, message: `Invalid event_type: ${event_type}` }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('analytics_events').insert({
      user_id: user?.id || null,
      event_type,
      opportunity_id: opportunity_id || null,
      category: category || null,
      country: country || null,
      metadata: metadata || {},
    })

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Failed to track event' }, { status: 500 })
  }
}
