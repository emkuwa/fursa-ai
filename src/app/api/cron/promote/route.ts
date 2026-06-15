import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/client'
import { OpportunityCollectionAgent } from '@/lib/agents/opportunity-collection'
import { CategorizationAgent } from '@/lib/agents/categorization'

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
    const promoteResult = await new OpportunityCollectionAgent().run('promote')
    const categorizeResult = await new CategorizationAgent().run('categorize')

    const supabase = createServiceClient()
    const { count: oppCount } = await supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)

    return NextResponse.json({
      success: true,
      duration_seconds: parseFloat(duration),
      total_opportunities: oppCount,
      promote: promoteResult,
      categorize: categorizeResult,
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
