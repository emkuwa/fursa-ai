import { NextResponse } from 'next/server'
import { createHash } from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(request: Request) {
  const startTime = Date.now()
  try {
    const { searchParams } = new URL(request.url)
    const batches = (searchParams.get('batch') || '0').split(',').map(Number)
    const totalBatches = parseInt(searchParams.get('totalBatches') || '8')
    const maxDurationMs = parseInt(searchParams.get('maxDurationMs') || '90000')

    // Dynamic import avoids cold-start module init race with Supabase realtime
    const { createServiceClient } = await import('@/lib/supabase/client')
    const { getScrapingProvider } = await import('@/lib/scraping/provider')

    const supabase = createServiceClient()

    const { data: sources } = await supabase
      .from('sources')
      .select('id, url, name, type')
      .eq('is_active', true)
      .order('quality_score', { ascending: false })

    if (!sources?.length) {
      return NextResponse.json({ success: true, message: 'No active sources', duration_seconds: 0 })
    }

    const scrapingProvider = getScrapingProvider()
    const batchSize = Math.ceil(sources.length / totalBatches)

    let crawled = 0
    let timedOut = 0
    let errors = 0

    for (const batchIndex of batches) {
      const batchStart = batchIndex * batchSize
      const batch = sources.slice(batchStart, batchStart + batchSize)

      for (const source of batch) {
        if (Date.now() - startTime > maxDurationMs) { timedOut++; continue }

        try {
          const opportunities = await scrapingProvider.scrapeSource(source)
          if (opportunities.length > 0) {
            for (const opp of opportunities) {
              const dedupKey = opp.title || opp.url || ''
              const idHash = createHash('sha256').update(dedupKey).digest('hex').slice(0, 16)
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
          }
          await supabase.from('sources').update({
            last_crawled_at: new Date().toISOString(),
            collection_count: supabase.rpc('increment', { x: 1 }) as any,
            collection_success_rate: 100,
          }).eq('id', source.id)
          crawled++
        } catch {
          errors++
          await supabase.from('sources').update({
            last_crawled_at: new Date().toISOString(),
            collection_success_rate: 0,
          }).eq('id', source.id)
        }
      }
    }

    return NextResponse.json({
      success: true,
      batches: batches.join(','),
      crawled,
      timedOut,
      errors,
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
