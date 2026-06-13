import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const supabase = await createServerSupabaseClient()

  // Full-text search
  const { data: textResults } = await supabase
    .from('opportunities')
    .select('id, title, summary, category, country, organization, quality_score, match_score, deadline')
    .in('status', ['approved', 'featured'])
    .or(`title.ilike.%${query}%,description.ilike.%${query}%,summary.ilike.%${query}%,organization.ilike.%${query}%`)
    .order('quality_score', { ascending: false })
    .limit(20)

  // Category suggestions
  const { data: categories } = await supabase
    .from('opportunities')
    .select('category, count:category', { count: 'exact' })
    .in('status', ['approved', 'featured'])
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .order('count', { ascending: false })
    .limit(5)

  return NextResponse.json({
    results: textResults || [],
    suggestions: (categories || []).map((c: any) => c.category),
    query,
  })
}
