import { NextRequest, NextResponse } from 'next/server'
import { runAgent, runFullPipeline } from '@/lib/agents/orchestrator'
import { requireAdmin } from '@/lib/api-auth'

export async function POST(request: NextRequest, { params }: { params: Promise<{ action: string }> }) {
  const { error } = await requireAdmin(request)
  if (error) return error

  const { action } = await params
  const body = await request.json().catch(() => ({}))

  try {
    if (action === 'run') {
      const result = await runAgent(body.agent, body.action, body.payload)
      return NextResponse.json(result)
    }

    if (action === 'pipeline') {
      const results = await runFullPipeline()
      return NextResponse.json({ success: true, results })
    }

    return NextResponse.json({ success: false, message: `Unknown action: ${action}` }, { status: 400 })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Agent execution failed',
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ action: string }> }) {
  const { error } = await requireAdmin(request)
  if (error) return error

  const { action } = await params

  if (action === 'list') {
    const { listAgents } = await import('@/lib/agents/orchestrator')
    return NextResponse.json({ agents: listAgents() })
  }

  return NextResponse.json({ success: false, message: `Unknown action: ${action}` }, { status: 400 })
}
