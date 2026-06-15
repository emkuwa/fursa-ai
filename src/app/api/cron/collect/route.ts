import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/client'
import { runFullPipeline } from '@/lib/agents/orchestrator'
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
  const results: Record<string, unknown> = {}

  try {
    results.collection = await new OpportunityCollectionAgent().run('collect')
    results.promotion = await new OpportunityCollectionAgent().run('promote')

    const supabase = createServiceClient()
    const { count: rawCount } = await supabase
      .from('raw_opportunities')
      .select('*', { count: 'exact', head: true })

    const { count: oppCount } = await supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)

    return NextResponse.json({
      success: true,
      duration_seconds: parseFloat(duration),
      raw_opportunities: rawCount,
      total_opportunities: oppCount,
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
