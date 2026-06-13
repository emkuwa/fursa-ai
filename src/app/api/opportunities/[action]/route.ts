import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params
  const supabase = await createServerSupabaseClient()
  const { searchParams } = new URL(request.url)

  try {
    if (action === 'search') {
      const query = searchParams.get('q') || ''
      const category = searchParams.get('category')
      const country = searchParams.get('country')
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')
      const offset = (page - 1) * limit

      let dbQuery = supabase
        .from('opportunities')
        .select('*', { count: 'exact' })
        .in('status', ['approved', 'featured'])

      if (query) {
        dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%,summary.ilike.%${query}%`)
      }
      if (category) dbQuery = dbQuery.eq('category', category)
      if (country) dbQuery = dbQuery.eq('country', country)

      const { data, count } = await dbQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      return NextResponse.json({ opportunities: data, total: count, page, limit })
    }

    if (action === 'ai-search') {
      const query = searchParams.get('q') || ''

      const { analyzeWithJSON } = await import('@/lib/ai/client')

      const searchParams_ai = await analyzeWithJSON<{
        categories: string[]
        countries: string[]
        keywords: string[]
      }>(`Extract search parameters from: "${query}". Return: { categories: [], countries: [], keywords: [] }`, 'analysis')

      let dbQuery = supabase
        .from('opportunities')
        .select('*', { count: 'exact' })
        .in('status', ['approved', 'featured'])

      if (searchParams_ai?.categories?.length) {
        dbQuery = dbQuery.in('category', searchParams_ai.categories)
      }
      if (searchParams_ai?.countries?.length) {
        dbQuery = dbQuery.in('country', searchParams_ai.countries)
      }
      if (searchParams_ai?.keywords?.length) {
        const keywordConditions = searchParams_ai.keywords.map(k => `title.ilike.%${k}%,description.ilike.%${k}%`).join(',')
        dbQuery = dbQuery.or(keywordConditions)
      }

      const { data, count } = await dbQuery.order('quality_score', { ascending: false }).limit(20)

      return NextResponse.json({
        query,
        parsed: searchParams_ai,
        opportunities: data,
        total: count,
      })
    }

    return NextResponse.json({ success: false, message: `Unknown action: ${action}` }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
