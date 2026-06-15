import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(request: Request) {
  try {
    const supabase = createServiceClient()

    const { data: sources } = await supabase
      .from('sources')
      .select('id, url, name, type')
      .eq('is_active', true)
      .order('quality_score', { ascending: false })
      .limit(5)

    return NextResponse.json({
      success: true,
      sourceCount: sources?.length || 0,
      message: `Quick test: ${sources?.length || 0} sources found`,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 })
  }
}
