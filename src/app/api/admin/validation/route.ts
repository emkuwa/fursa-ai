import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/client'
import { requireAdmin } from '@/lib/api-auth'

function formatCounts(rows: any[] | null, field: string) {
  const counts: Record<string, number> = {}
  if (!rows) return counts
  for (const row of rows) {
    const key = (row[field] || 'Unknown').toString() || 'Unknown'
    counts[key] = (counts[key] || 0) + 1
  }
  return counts
}

function normalizeTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin(request)
  if (error) return error

  const supabase = createServiceClient()
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const weekStart = new Date(now.getTime() - 7 * 86400000).toISOString()

  const [totalRes, todayRes, weekRes, expiredRes, rejectedRes, categoriesRes, countriesRes, titleRowsRes, sourcesTopRes, sourcesWorstRes, sourceTotalRes, sourceActiveRes, sourceHealthRes, betaCountRes] = await Promise.all([
    supabase.from('opportunities').select('id', { count: 'exact', head: true }),
    supabase.from('opportunities').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
    supabase.from('opportunities').select('id', { count: 'exact', head: true }).gte('created_at', weekStart),
    supabase.from('opportunities').select('id', { count: 'exact', head: true }).eq('status', 'expired'),
    supabase.from('opportunities').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
    supabase.from('opportunities').select('category, country'),
    supabase.from('opportunities').select('country'),
    supabase.from('opportunities').select('title').neq('status', 'rejected').limit(5000),
    supabase.from('sources').select('id, name, collection_success_rate, quality_score, error_count, last_crawled_at, is_active').order('collection_success_rate', { ascending: false }).limit(50),
    supabase.from('sources').select('id, name, collection_success_rate, quality_score, error_count, last_crawled_at, is_active').order('collection_success_rate', { ascending: true }).limit(50),
    supabase.from('sources').select('id', { count: 'exact', head: true }),
    supabase.from('sources').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('source_health').select('status'),
    supabase.from('beta_waitlist').select('id', { count: 'exact', head: true }),
  ])

  if (totalRes.error || todayRes.error || weekRes.error || expiredRes.error || rejectedRes.error || categoriesRes.error || countriesRes.error || titleRowsRes.error || sourcesTopRes.error || sourcesWorstRes.error || sourceHealthRes.error || betaCountRes.error) {
    const error = totalRes.error || todayRes.error || weekRes.error || expiredRes.error || rejectedRes.error || categoriesRes.error || countriesRes.error || titleRowsRes.error || sourcesTopRes.error || sourcesWorstRes.error || sourceHealthRes.error || betaCountRes.error
    return NextResponse.json({ success: false, message: error?.message || 'Failed to load validation metrics' }, { status: 500 })
  }

  const categoryCounts = formatCounts(categoriesRes.data, 'category')
  const countryCounts = formatCounts(countriesRes.data, 'country')
  const normalizedTitles = new Set((titleRowsRes.data || []).map((row: any) => normalizeTitle(row.title || '')))
  const totalTitles = (titleRowsRes.data || []).length
  const duplicateRate = totalTitles ? Math.round(((totalTitles - normalizedTitles.size) / totalTitles) * 100) : 0
  const totalOpportunities = totalRes.count || 0
  const expiredRate = totalOpportunities ? Math.round(((expiredRes.count || 0) / totalOpportunities) * 100) : 0
  const rejectedRate = totalOpportunities ? Math.round(((rejectedRes.count || 0) / totalOpportunities) * 100) : 0

  const sourceHealth = { healthy: 0, degraded: 0, dead: 0 }
  for (const row of sourceHealthRes.data || []) {
    if (row.status === 'healthy') sourceHealth.healthy++
    else if (row.status === 'degraded') sourceHealth.degraded++
    else if (row.status === 'dead') sourceHealth.dead++
  }

  return NextResponse.json({
    success: true,
    data: {
      total_opportunities: totalOpportunities,
      opportunities_today: todayRes.count || 0,
      opportunities_this_week: weekRes.count || 0,
      opportunities_by_category: categoryCounts,
      opportunities_by_country: countryCounts,
      duplicate_rate: duplicateRate,
      expired_rate: expiredRate,
      rejected_rate: rejectedRate,
      total_sources: sourceTotalRes.count || 0,
      active_sources: sourceActiveRes.count || 0,
      top_sources: sourcesTopRes.data || [],
      worst_sources: sourcesWorstRes.data || [],
      source_health: sourceHealth,
      beta_waitlist_count: betaCountRes.count || 0,
    },
  })
}
