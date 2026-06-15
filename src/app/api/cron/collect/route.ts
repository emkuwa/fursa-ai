import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET() {
  const startTime = Date.now()
  try {
    const { createServiceClient } = await import('@/lib/supabase/client')
    const { getScrapingProvider } = await import('@/lib/scraping/provider')
    const supabase = createServiceClient()
    const provider = getScrapingProvider()

    const { data: sources } = await supabase.from('sources').select('id, url, name').limit(1)

    return NextResponse.json({
      success: true,
      provider: provider.providerName,
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
