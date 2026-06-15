import { NextResponse } from 'next/server'
import { getAgent } from '@/lib/agents/orchestrator'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const expectedToken = process.env.CRON_SECRET

  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  try {
    const qcAgent = getAgent('quality_control')
    const audit = qcAgent ? await qcAgent.run('audit') : { success: false, message: 'quality_control agent not found' }
    const approve = qcAgent ? await qcAgent.run('approve') : { success: false, message: 'quality_control agent not found' }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)

    return NextResponse.json({
      success: true,
      duration_seconds: parseFloat(duration),
      audit,
      approve,
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
