import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createServiceClient()

  const { data: sources } = await supabase
    .from('sources')
    .select('id, name, type, url, is_active, last_crawled_at, error_count, collection_count, collection_success_rate, quality_score, update_frequency_hours')
    .order('quality_score', { ascending: false })

  if (!sources) {
    return NextResponse.json({ error: 'No sources found' }, { status: 404 })
  }

  const now = new Date()
  const staleHours = 48

  const result = {
    total_sources: sources.length,
    active: sources.filter(s => s.is_active).length,
    never_crawled: sources.filter(s => !s.last_crawled_at).length,
    stale: sources.filter(s => {
      if (!s.last_crawled_at) return false
      const age = (now.getTime() - new Date(s.last_crawled_at).getTime()) / 3600000
      return age > s.update_frequency_hours * 2
    }).length,
    healthy: sources.filter(s => s.error_count === 0 && s.last_crawled_at).length,
    errored: sources.filter(s => (s.error_count || 0) > 0).length,
    sources: sources.map(s => ({
      id: s.id,
      name: s.name,
      type: s.type,
      is_active: s.is_active,
      quality_score: s.quality_score,
      last_crawled_at: s.last_crawled_at,
      collection_count: s.collection_count,
      success_rate: s.collection_success_rate,
      error_count: s.error_count,
      health_score: s.last_crawled_at
        ? Math.max(0, Math.min(100, s.collection_success_rate - s.error_count * 10))
        : 0,
      status: !s.last_crawled_at ? 'never_crawled'
        : (s.error_count || 0) > 5 ? 'dead'
        : (s.error_count || 0) > 0 ? 'degraded'
        : 'active',
    })),
    timestamp: now.toISOString(),
  }

  return NextResponse.json(result)
}
