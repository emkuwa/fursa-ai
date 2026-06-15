import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/client'
import { getScrapingProvider } from '@/lib/scraping/provider'
import { createHash } from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(request: Request) {
  const scrapingProvider = getScrapingProvider()
  const authHeader = request.headers.get('authorization')
  const expectedToken = process.env.CRON_SECRET

  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const { searchParams } = new URL(request.url)
  const batchParam = searchParams.get('batch') || '0'
  const totalBatches = parseInt(searchParams.get('totalBatches') || '8', 10)
  const maxDurationMs = parseInt(searchParams.get('maxDurationMs') || '90000', 10)
  const batches = batchParam.split(',').map(Number).filter(n => !isNaN(n))

  try {
    const supabase = createServiceClient()
    const results = []

    for (const b of batches) {
      const { data: sources } = await supabase
        .from('sources')
        .select('id, url, name, type')
        .eq('is_active', true)
        .order('quality_score', { ascending: false })

      if (!sources?.length) {
        results.push({ batch: b, message: 'No active sources' })
        continue
      }

      const batchSize = Math.ceil(sources.length / totalBatches)
      const startIdx = b * batchSize
      const batchSources = sources.slice(startIdx, startIdx + batchSize)
      const batchStart = Date.now()
      let collected = 0, errors = 0

      for (const source of batchSources) {
        if (Date.now() - startTime > maxDurationMs) {
          results.push({ batch: b, timedOut: true, collected, errors })
          break
        }
        try {
          const opps = await scrapingProvider.scrapeSource(source as any)
          if (opps.length > 0) {
            for (const opp of opps) {
              const hash = createHash('sha256').update(opp.title + opp.url).digest('hex')
              const { error } = await supabase.from('raw_opportunities').insert({
                source_id: source.id,
                title: opp.title,
                description: opp.description,
                url: opp.url,
                deadline: opp.deadline,
                country: opp.country,
                category: opp.category || source.type || 'scholarship',
                organization: opp.organization,
                eligibility: opp.eligibility,
                raw_html: opp.rawHtml,
                hash,
              }).maybeSingle()
              if (!error) collected++
            }
            await supabase.from('sources').update({ last_crawled_at: new Date().toISOString() }).eq('id', source.id)
          }
        } catch (e) {
          errors++
        }
      }
      results.push({ batch: b, sources: batchSources.length, collected, errors, duration_ms: Date.now() - batchStart })
    }

    const { count: rawCount } = await supabase
      .from('raw_opportunities')
      .select('*', { count: 'exact', head: true })

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)

    return NextResponse.json({
      success: true,
      duration_seconds: parseFloat(duration),
      raw_opportunities: rawCount,
      batches,
      totalBatches,
      results,
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
