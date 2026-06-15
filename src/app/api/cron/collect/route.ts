import { NextResponse } from 'next/server'
import { createHash } from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(request: Request) {
  const startTime = Date.now()
  try {
    const { searchParams } = new URL(request.url)
    const maxDurationMs = parseInt(searchParams.get('maxDurationMs') || '30000')

    const { createServiceClient } = await import('@/lib/supabase/client')
    const supabase = createServiceClient()

    const { data: sources } = await supabase
      .from('sources')
      .select('id, url, name, type')
      .eq('is_active', true)
      .order('quality_score', { ascending: false })

    if (!sources?.length) {
      return NextResponse.json({ success: true, message: 'No active sources', duration_seconds: 0 })
    }

    const { getScrapingProvider } = await import('@/lib/scraping/provider')
    const scrapingProvider = getScrapingProvider()

    let crawled = 0
    let errors = 0
    const details: any[] = []

    // Try up to 3 sources
    for (const source of sources.slice(0, 3)) {
      if (Date.now() - startTime > maxDurationMs) break

      try {
        const opportunities = await scrapingProvider.scrapeSource(source)
        for (const opp of opportunities) {
          const idHash = createHash('sha256').update(opp.title || opp.url || '').digest('hex').slice(0, 16)
          await supabase.from('raw_opportunities').insert({
            source_id: source.id,
            title: opp.title || 'Untitled',
            description: opp.description || null,
            url: opp.url || null,
            deadline: opp.deadline || null,
            country: opp.country || null,
            category: (opp.category || source.type || 'scholarship') as string,
            organization: opp.organization || source.name || null,
            eligibility: opp.eligibility || null,
            source_hash: idHash,
          })
        }
        await supabase.from('sources').update({
          last_crawled_at: new Date().toISOString(),
          collection_success_rate: 100,
        }).eq('id', source.id)
        crawled++
        details.push({ name: source.name, found: opportunities.length })
      } catch (e: any) {
        errors++
        details.push({ name: source.name, error: e.message?.slice(0, 100) || String(e).slice(0, 100) })
      }
    }

    return NextResponse.json({
      success: true,
      crawled,
      errors,
      details,
      duration_seconds: ((Date.now() - startTime) / 1000).toFixed(1),
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
