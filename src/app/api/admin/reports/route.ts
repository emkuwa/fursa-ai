import { NextRequest, NextResponse } from 'next/server'
import { runAgent } from '@/lib/agents/orchestrator'
import { requireAdmin } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin(request)
  if (error) return error

  const dailyResult = await runAgent('admin_copilot', 'daily-report')
  const growthResult = await runAgent('admin_copilot', 'growth-report')
  const errorResult = await runAgent('admin_copilot', 'error-report')

  return NextResponse.json({
    daily: dailyResult.data || {},
    growth: growthResult.data || {},
    errors: errorResult.data || {},
  })
}
