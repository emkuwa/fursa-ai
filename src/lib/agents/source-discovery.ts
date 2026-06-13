import { BaseAgent, type AgentResult } from './base-agent'
import { SOURCE_REGISTRY, getTotalSourceCount } from './source-registry'

export class SourceDiscoveryAgent extends BaseAgent {
  constructor() {
    super('source_discovery', 3)
  }

  async execute(action: string, payload?: Record<string, unknown>): Promise<AgentResult> {
    switch (action) {
      case 'initialize':
        return this.initializeFromRegistry()
      case 'discover':
        return this.discoverNewSources()
      case 'score':
        return this.scoreAllSources()
      case 'score-source':
        return this.scoreSource(payload?.sourceId as string)
      case 'health-check':
        return this.healthCheckAll()
      case 'cleanup':
        return this.autoDisableBadSources()
      case 'dashboard':
        return this.sourceHealthDashboard()
      case 'stats':
        return this.getRegistryStats()
      default:
        return { success: false, message: `Unknown action: ${action}` }
    }
  }

  private async initializeFromRegistry(): Promise<AgentResult> {
    let inserted = 0
    let skipped = 0
    const allSources = Object.values(SOURCE_REGISTRY).flat()

    for (const source of allSources) {
      const { data: existing } = await this.supabase
        .from('sources')
        .select('id')
        .eq('url', source.url)
        .maybeSingle()

      if (!existing) {
        await this.supabase.from('sources').insert({
          url: source.url,
          name: source.name,
          type: source.type,
          region: source.region,
          quality_score: source.quality,
          freshness_score: source.frequency <= 6 ? 90 : source.frequency <= 12 ? 75 : 60,
          authority_score: source.quality >= 85 ? 90 : source.quality >= 70 ? 70 : 50,
          update_frequency_hours: source.frequency,
          spam_risk: Math.max(5, Math.round((100 - source.quality) / 4)),
          duplicate_risk: Math.max(5, Math.round((100 - source.quality) / 3)),
          is_active: source.quality >= 30,
          collection_count: 0,
          collection_success_rate: 100,
          error_count: 0,
        })
        inserted++
      } else {
        skipped++
      }
    }

    const total = allSources.length
    await this.log(`Initialized ${inserted} new sources, ${skipped} already existed. Total in registry: ${total}`)
    return { success: true, message: `Initialized ${inserted} sources from ${total} registry entries`, data: { total, inserted, skipped } as any }
  }

  private async discoverNewSources(): Promise<AgentResult> {
    const totalSources = getTotalSourceCount()
    await this.log(`Registry has ${totalSources} sources configured across ${Object.keys(SOURCE_REGISTRY).length} categories`)
    return { success: true, message: `Registry: ${totalSources} sources in ${Object.keys(SOURCE_REGISTRY).length} categories` }
  }

  private async scoreAllSources(): Promise<AgentResult> {
    const { data: sources } = await this.supabase
      .from('sources')
      .select('id, url, name, quality_score, error_count, collection_count, collection_success_rate, update_frequency_hours')
      .eq('is_active', true)

    if (!sources?.length) return { success: true, message: 'No active sources to score' }

    for (const source of sources) {
      const score = await this.computeSourceQuality(source)
      await this.supabase.from('sources').update({ quality_score: score }).eq('id', source.id)
    }

    return { success: true, message: `Scored ${sources.length} sources` }
  }

  private async scoreSource(sourceId?: string): Promise<AgentResult> {
    if (!sourceId) return { success: false, message: 'No source ID' }
    const { data: source } = await this.supabase.from('sources').select('*').eq('id', sourceId).single()
    if (!source) return { success: false, message: 'Source not found' }
    const score = await this.computeSourceQuality(source)
    return { success: true, message: `Source scored: ${score}`, data: { score } as any }
  }

  private async computeSourceQuality(source: any): Promise<number> {
    let score = 50
    if (source.collection_count > 0 && source.collection_success_rate > 0) {
      score += (source.collection_success_rate / 10)
    }
    if (source.error_count === 0) score += 10
    else score -= Math.min(30, source.error_count * 5)
    if (source.update_frequency_hours <= 6) score += 15
    else if (source.update_frequency_hours <= 12) score += 10
    else if (source.update_frequency_hours <= 24) score += 5
    return Math.max(0, Math.min(100, Math.round(score)))
  }

  private async healthCheckAll(): Promise<AgentResult> {
    const { data: sources } = await this.supabase
      .from('sources')
      .select('id, url, name, quality_score, error_count, last_crawled_at')
      .eq('is_active', true)

    if (!sources?.length) return { success: true, message: 'No sources to check' }

    let healthy = 0; let degraded = 0; let dead = 0
    const now = new Date()

    for (const source of sources) {
      let status: string
      const staleDays = source.last_crawled_at
        ? (now.getTime() - new Date(source.last_crawled_at).getTime()) / 86400000
        : 999

      if (source.quality_score >= 60 && source.error_count < 3 && staleDays < 7) {
        status = 'healthy'; healthy++
      } else if (source.quality_score >= 30 && staleDays < 30) {
        status = 'degraded'; degraded++
      } else {
        status = 'dead'; dead++
      }

      await this.supabase.from('source_health').upsert({
        source_id: source.id,
        status,
        error_rate_24h: source.error_count > 0 ? Math.min(100, source.error_count * 20) : 0,
        collection_count_24h: 0,
        success_rate_24h: source.quality_score,
        avg_response_time_ms: 0,
        last_error: source.error_count > 0 ? 'Multiple failures' : null,
        checked_at: now.toISOString(),
      }).maybeSingle()
    }

    return { success: true, message: `Health check: ${healthy} healthy, ${degraded} degraded, ${dead} dead` }
  }

  private async autoDisableBadSources(): Promise<AgentResult> {
    const now = new Date()
    const staleThreshold = new Date(now.getTime() - 30 * 86400000).toISOString()

    const { data: badSources } = await this.supabase
      .from('sources')
      .select('id, name, quality_score, error_count')
      .lt('quality_score', 20)
      .eq('is_active', true)

    const { data: staleSources } = await this.supabase
      .from('sources')
      .select('id, name')
      .lt('last_crawled_at', staleThreshold)
      .eq('is_active', true)

    let disabled = 0
    for (const source of [...(badSources || []), ...(staleSources || [])]) {
      await this.supabase.from('sources')
        .update({ is_active: false, last_error_message: 'Auto-disabled: quality too low or stale' })
        .eq('id', source.id)
      disabled++
    }

    await this.log(`Auto-disabled ${disabled} low-quality or stale sources`)
    return { success: true, message: `Disabled ${disabled} sources` }
  }

  private async sourceHealthDashboard(): Promise<AgentResult> {
    const { data: sources } = await this.supabase
      .from('sources')
      .select('id, name, type, quality_score, is_active, error_count, collection_count, collection_success_rate, last_crawled_at, last_error_at')

    const allSources = (sources || []) as any[]
    const active = allSources.filter((s: any) => s.is_active)
    const inactive = allSources.filter((s: any) => !s.is_active)
    const withErrors = active.filter((s: any) => s.error_count > 0)
    const highQuality = active.filter((s: any) => s.quality_score >= 70)
    const lowQuality = active.filter((s: any) => s.quality_score < 30)

    const typeBreakdown: Record<string, number> = {}
    for (const s of active as any[]) {
      typeBreakdown[s.type] = (typeBreakdown[s.type] || 0) + 1
    }

    const registryTotal = getTotalSourceCount()

    const dashboard = {
      total_sources: sources?.length || 0,
      registry_total: registryTotal,
      active_sources: active.length,
      inactive_sources: inactive.length,
      sources_with_errors: withErrors.length,
      high_quality_sources: highQuality.length,
      low_quality_sources: lowQuality.length,
      avg_quality: active.length ? Math.round(active.reduce((s: number, a: any) => s + a.quality_score, 0) / active.length) : 0,
      type_breakdown: typeBreakdown,
      coverage_pct: active.length ? Math.round((active.length / registryTotal) * 100) : 0,
    }

    return { success: true, message: 'Source health dashboard generated', data: dashboard as any }
  }

  private async getRegistryStats(): Promise<AgentResult> {
    const stats: Record<string, number> = {}
    for (const [cat, sources] of Object.entries(SOURCE_REGISTRY)) {
      stats[cat] = sources.length
    }
    return { success: true, message: `Registry stats: ${getTotalSourceCount()} total sources`, data: { ...stats, total: getTotalSourceCount() } as any }
  }
}
