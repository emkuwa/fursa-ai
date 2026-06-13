import { BaseAgent, AgentResult } from './base-agent'
import { COUNTRIES } from '@/lib/constants'

export class OpportunityMapAgent extends BaseAgent {
  constructor() {
    super('opportunity_map', 3)
  }

  async execute(action: string, payload?: Record<string, unknown>): Promise<AgentResult> {
    switch (action) {
      case 'country-intelligence':
        return this.countryIntelligence()
      case 'country-rankings':
        return this.countryRankings()
      case 'category-map':
        return this.categoryMap()
      default:
        return { success: false, message: `Unknown action: ${action}` }
    }
  }

  async countryIntelligence(): Promise<AgentResult> {
    const countries = [...COUNTRIES]
    const intelligence: any[] = []

    for (const country of countries) {
      const [oppsRes, viewsRes, savesRes] = await Promise.all([
        this.supabase.from('opportunities').select('id, category, view_count, application_count', { count: 'exact', head: false })
          .eq('country', country).in('status', ['approved', 'featured']),
        this.supabase.from('analytics_events').select('id', { count: 'exact', head: true })
          .eq('country', country.toLowerCase()).eq('event_type', 'view').gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
        this.supabase.from('analytics_events').select('id', { count: 'exact', head: true })
          .eq('country', country.toLowerCase()).eq('event_type', 'save').gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
      ])

      const opps = oppsRes.data || []
      const categories: Record<string, number> = {}
      for (const opp of opps) {
        if (opp.category) categories[opp.category] = (categories[opp.category] || 0) + 1
      }
      const totalViews = (opps as any[]).reduce((s: number, o: any) => s + (o.view_count || 0), 0)

      intelligence.push({
        country,
        total_opportunities: oppsRes.count || 0,
        categories: categories,
        views_30d: viewsRes.count || 0,
        saves_30d: savesRes.count || 0,
        total_views: totalViews,
        applications: (opps as any[]).reduce((s: number, o: any) => s + (o.application_count || 0), 0),
      })
    }

    const sorted = intelligence.sort((a, b) => b.total_opportunities - a.total_opportunities)

    return { success: true, message: `Country intelligence for ${sorted.length} countries`, data: { countries: sorted } as any }
  }

  async countryRankings(): Promise<AgentResult> {
    const result = await this.countryIntelligence()
    if (!result.success || !result.data) return result

    const countries = (result.data as any).countries as any[]
    const topByOpps = countries.slice(0, 10).map((c, i) => ({ rank: i + 1, ...c }))
    const topByViews = [...countries].sort((a, b) => b.views_30d - a.views_30d).slice(0, 10).map((c, i) => ({ rank: i + 1, ...c }))

    return { success: true, message: 'Country rankings generated', data: { by_opportunities: topByOpps, by_engagement: topByViews } as any }
  }

  async categoryMap(): Promise<AgentResult> {
    const { data: opps } = await this.supabase
      .from('opportunities')
      .select('category, country, view_count')
      .in('status', ['approved', 'featured'])

    if (!opps) return { success: true, message: 'No data' }

    const map: Record<string, Record<string, { count: number; views: number }>> = {}

    for (const opp of opps as any[]) {
      const cat = opp.category || 'uncategorized'
      const country = opp.country || 'global'
      if (!map[cat]) map[cat] = {}
      if (!map[cat][country]) map[cat][country] = { count: 0, views: 0 }
      map[cat][country].count++
      map[cat][country].views += opp.view_count || 0
    }

    return { success: true, message: 'Category map generated', data: { map } as any }
  }
}
