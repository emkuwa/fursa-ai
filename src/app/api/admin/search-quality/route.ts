import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/client'
import { requireAdmin } from '@/lib/api-auth'

const SEARCH_TESTS = [
  { label: 'Scholarships in Germany', category: 'scholarship', country: 'Germany', keywords: ['scholarship'] },
  { label: 'Engineering jobs in Canada', category: 'foreign_job', country: 'Canada', keywords: ['engineering', 'job'] },
  { label: 'NGO grants in Africa', category: 'grant', country: 'Africa', keywords: ['ngo', 'grant'] },
]

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin(request)
  if (error) return error
  try {
    const supabase = createServiceClient()

    const results = await Promise.all(SEARCH_TESTS.map(async (test) => {
      let query = supabase
        .from('opportunities')
        .select('id, title, ranking_score, quality_score, category, country', { count: 'exact' })
        .in('status', ['approved', 'featured'])
        .order('ranking_score', { ascending: false })
        .limit(20)

      if (test.category) query = query.eq('category', test.category)
      if (test.country) query = query.ilike('country', `%${test.country}%`)
      if (test.keywords.length > 0) {
        const keywordFilters = test.keywords.map((keyword) => `title.ilike.%${keyword}%`).join(',')
        query = query.or(keywordFilters)
      }

      const start = Date.now()
      const { data, error, count } = await query
      const duration = Date.now() - start
      if (error) {
        return { label: test.label, error: error.message }
      }

      const avgRanking = data && data.length ? Math.round((data.reduce((sum: number, item: any) => sum + (item.ranking_score || 0), 0) / data.length) * 10) / 10 : 0
      const avgQuality = data && data.length ? Math.round((data.reduce((sum: number, item: any) => sum + (item.quality_score || 0), 0) / data.length) * 10) / 10 : 0
      return {
        label: test.label,
        count: count || data?.length || 0,
        duration_ms: duration,
        avg_ranking_score: avgRanking,
        avg_quality_score: avgQuality,
        sample_results: data || [],
      }
    }))

    return NextResponse.json({ success: true, results })
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Search quality check failed' }, { status: 500 })
  }
}
