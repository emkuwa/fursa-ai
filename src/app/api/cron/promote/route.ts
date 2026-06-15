import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const expectedToken = process.env.CRON_SECRET

  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  try {
    const supabase = createServiceClient()

    const { data: rawOpps } = await supabase
      .from('raw_opportunities')
      .select('*')

    const { data: existingOpps } = await supabase
      .from('opportunities')
      .select('title, url')

    const existingTitles = new Set((existingOpps || []).map(r => `${r.title}|||${r.url}`))

    let promoted = 0, skipped = 0, duplicates = 0

    for (const raw of rawOpps || []) {
      if (!raw.title || !raw.url) { skipped++; continue }
      if (existingTitles.has(`${raw.title}|||${raw.url}`)) { duplicates++; continue }

      const { error } = await supabase.from('opportunities').insert({
        source_id: raw.source_id,
        title: raw.title,
        description: raw.description,
        summary: (raw.description || '').slice(0, 200) || null,
        url: raw.url,
        application_link: raw.url,
        deadline: raw.deadline,
        country: raw.country,
        category: raw.category || 'scholarship',
        organization: raw.organization,
        eligibility: raw.eligibility,
        status: 'pending',
        quality_score: 50,
      })

      if (!error) {
        existingTitles.add(`${raw.title}|||${raw.url}`)
        promoted++
      }
    }

    const { count: oppCount } = await supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)

    return NextResponse.json({
      success: true,
      duration_seconds: parseFloat(duration),
      total_opportunities: oppCount,
      promoted,
      duplicates,
      skipped,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
      duration_seconds: ((Date.now() - startTime) / 1000).toFixed(1),
    }, { status: 500 })
  }
}
