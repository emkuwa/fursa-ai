import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(_request: NextRequest) {
  const supabase = await createServerSupabaseClient()

  const { data: sources } = await supabase
    .from('sources')
    .select('id, name, type, region, quality_score, is_active, error_count, collection_count, collection_success_rate, last_crawled_at, last_error_at, last_error_message')

  const allSources = (sources || []) as any[]
  const active = allSources.filter(s => s.is_active)
  const inactive = allSources.filter(s => !s.is_active)

  const typeBreakdown: Record<string, { total: number; active: number; avgQuality: number }> = {}
  for (const s of allSources) {
    if (!typeBreakdown[s.type]) typeBreakdown[s.type] = { total: 0, active: 0, avgQuality: 0 }
    typeBreakdown[s.type].total++
    if (s.is_active) typeBreakdown[s.type].active++
    typeBreakdown[s.type].avgQuality += s.quality_score || 0
  }
  for (const t of Object.keys(typeBreakdown)) {
    typeBreakdown[t].avgQuality = Math.round(typeBreakdown[t].avgQuality / (typeBreakdown[t].total || 1))
  }

  const regionBreakdown: Record<string, number> = {}
  for (const s of active) {
    regionBreakdown[s.region] = (regionBreakdown[s.region] || 0) + 1
  }

  const { count: totalOpps } = await supabase
    .from('opportunities')
    .select('*', { count: 'exact', head: true })
    .in('status', ['approved', 'featured'])

  const { count: totalRaw } = await supabase
    .from('raw_opportunities')
    .select('*', { count: 'exact', head: true })

  const { data: recentTasks } = await supabase
    .from('agent_tasks')
    .select('agent_name, status, created_at, completed_at, error')
    .order('created_at', { ascending: false })
    .limit(20)

  const { data: recentHealth } = await supabase
    .from('source_health')
    .select('source_id, status, checked_at, last_error')
    .order('checked_at', { ascending: false })
    .limit(50)

  const healthCounts = { healthy: 0, degraded: 0, dead: 0 }
  for (const h of (recentHealth || [])) {
    if (h.status in healthCounts) healthCounts[h.status as keyof typeof healthCounts]++
  }

  const failedImports = allSources.filter(s => s.error_count > 0)
    .sort((a, b) => b.error_count - a.error_count)
    .slice(0, 20)

  const neverCrawled = allSources.filter(s => !s.last_crawled_at && s.is_active)

  const staleSources = allSources.filter(s => {
    if (!s.last_crawled_at || !s.is_active) return false
    const daysSince = (Date.now() - new Date(s.last_crawled_at).getTime()) / 86400000
    return daysSince > 7
  })

  return NextResponse.json({
    summary: {
      total_sources: allSources.length,
      active_sources: active.length,
      inactive_sources: inactive.length,
      total_opportunities: totalOpps || 0,
      total_raw_pending: totalRaw || 0,
      avg_quality: active.length ? Math.round(active.reduce((s, a) => s + (a.quality_score || 0), 0) / active.length) : 0,
    },
    type_breakdown: typeBreakdown,
    region_breakdown: regionBreakdown,
    health: healthCounts,
    recent_tasks: (recentTasks || []).map(t => ({
      agent: t.agent_name,
      status: t.status,
      created: t.created_at,
      completed: t.completed_at,
      error: t.error,
    })),
    failed_imports: failedImports.map(s => ({
      name: s.name,
      type: s.type,
      region: s.region,
      error_count: s.error_count,
      last_error: s.last_error_message,
      last_crawled: s.last_crawled_at,
    })),
    never_crawled: neverCrawled.length,
    stale_sources: staleSources.length,
  })
}
