import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET() {
  const startTime = Date.now()
  try {
    const { createServiceClient } = await import('@/lib/supabase/client')
    const supabase = createServiceClient()

    const { data: sources } = await supabase.from('sources').select('id, url, name').limit(3)

    return NextResponse.json({
      success: true,
      count: sources?.length || 0,
      first: sources?.[0]?.name || 'none',
      duration_seconds: ((Date.now() - startTime) / 1000).toFixed(1),
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
      duration_seconds: ((Date.now() - startTime) / 1000).toFixed(1),
    }, { status: 500 })
  }
}
