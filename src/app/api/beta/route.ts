import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = (body.email || '').toString().trim()
    const full_name = (body.full_name || '').toString().trim()
    const country = (body.country || '').toString().trim()
    const interest_category = (body.interest_category || '').toString().trim()
    const source_page = (body.source_page || '').toString().trim()

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    const { data: existing } = await supabase
      .from('beta_waitlist')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ success: false, message: 'This email is already on the waitlist' }, { status: 409 })
    }

    const { data, error } = await supabase
      .from('beta_waitlist')
      .insert({ email, full_name, country, interest_category, source_page })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    await supabase.from('analytics_events').insert({
      event_type: 'beta_signup',
      country: country || null,
      category: interest_category || null,
      metadata: { source_page },
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Failed to submit beta signup' }, { status: 500 })
  }
}
