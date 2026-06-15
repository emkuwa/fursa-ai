import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/client'
import { OpportunityCollectionAgent } from '@/lib/agents/opportunity-collection'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(request: Request) {
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

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), (maxDurationMs + 15000))

  try {
    const results = []
    for (const b of batches) {
      const r = await new OpportunityCollectionAgent().run('collect', {
        batch: b,
        totalBatches,
        maxDurationMs: Math.min(maxDurationMs, 60000),
      })
      results.push({ batch: b, result: r })
    }

    clearTimeout(timeout)

    const supabase = createServiceClient()
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
    clearTimeout(timeout)
    return NextResponse.json({
      success: false,
      error: String(error),
      duration_seconds: ((Date.now() - startTime) / 1000).toFixed(1),
    }, { status: 500 })
  }
}
