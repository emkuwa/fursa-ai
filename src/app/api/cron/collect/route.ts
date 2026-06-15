import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET() {
  const startTime = Date.now()
  try {
    // Test just the import
    const mod = await import('@/lib/scraping/provider')
    const scrapingProvider = mod.getScrapingProvider()

    return NextResponse.json({
      success: true,
      provider: scrapingProvider.providerName,
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
