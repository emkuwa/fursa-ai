import { BaseAgent, AgentResult } from './base-agent'

export class TrendPredictionAgent extends BaseAgent {
  constructor() {
    super('trend_prediction', 3)
  }

  async execute(action: string, payload?: Record<string, unknown>): Promise<AgentResult> {
    switch (action) {
      case 'analyze':
        return this.analyzeTrends()
      case 'fastest-countries':
        return this.fastestCountries()
      case 'fastest-sectors':
        return this.fastestSectors()
      case 'high-demand-skills':
        return this.highDemandSkills()
      default:
        return { success: false, message: `Unknown action: ${action}` }
    }
  }

  async analyzeTrends(): Promise<AgentResult> {
    const countriesResult = await this.fastestCountries()
    const sectorsResult = await this.fastestSectors()
    const skillsResult = await this.highDemandSkills()

    return {
      success: true,
      message: 'Trend analysis complete',
      data: {
        fastest_countries: (countriesResult.data as any)?.countries || [],
        fastest_sectors: (sectorsResult.data as any)?.sectors || [],
        high_demand_skills: (skillsResult.data as any)?.skills || [],
        generated_at: new Date().toISOString(),
      } as any,
    }
  }

  async fastestCountries(): Promise<AgentResult> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()
    const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000).toISOString()

    const { data: recentOpps } = await this.supabase
      .from('opportunities')
      .select('country, count:country', { count: 'exact' })
      .gte('created_at', thirtyDaysAgo)
      .in('status', ['approved', 'featured'])

    const { data: prevOpps } = await this.supabase
      .from('opportunities')
      .select('country, count:country', { count: 'exact' })
      .gte('created_at', sixtyDaysAgo)
      .lt('created_at', thirtyDaysAgo)
      .in('status', ['approved', 'featured'])

    const recent = new Map((recentOpps || []).map((r: any) => [r.country, r.count]))
    const prev = new Map((prevOpps || []).map((r: any) => [r.country, r.count]))

    const growth: { country: string; growth_pct: number; total: number }[] = []

    for (const [country, count] of recent.entries()) {
      const prevCount = (prev.get(country) as number) || 0
      const pct = prevCount > 0 ? Math.round((((count as number) - prevCount) / prevCount) * 100) : 100
      growth.push({ country: (country as string) || 'global', growth_pct: pct, total: count as number })
    }

    growth.sort((a, b) => b.growth_pct - a.growth_pct)

    return { success: true, message: 'Fastest countries identified', data: { countries: growth.slice(0, 15) } as any }
  }

  async fastestSectors(): Promise<AgentResult> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()
    const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000).toISOString()

    const { data: recent } = await this.supabase
      .from('opportunities')
      .select('category, count:category', { count: 'exact' })
      .gte('created_at', thirtyDaysAgo)
      .in('status', ['approved', 'featured'])

    const { data: previous } = await this.supabase
      .from('opportunities')
      .select('category, count:category', { count: 'exact' })
      .gte('created_at', sixtyDaysAgo)
      .lt('created_at', thirtyDaysAgo)
      .in('status', ['approved', 'featured'])

    const recentMap = new Map((recent || []).map((r: any) => [r.category, r.count]))
    const prevMap = new Map((previous || []).map((r: any) => [r.category, r.count]))

    const sectors: { sector: string; growth_pct: number; total: number }[] = []

    for (const [cat, count] of recentMap.entries()) {
      const prevCount = (prevMap.get(cat) as number) || 0
      const pct = prevCount > 0 ? Math.round((((count as number) - prevCount) / prevCount) * 100) : 100
      sectors.push({ sector: (cat as string).replace(/_/g, ' '), growth_pct: pct, total: count as number })
    }

    sectors.sort((a, b) => b.growth_pct - a.growth_pct)

    return { success: true, message: 'Fastest sectors identified', data: { sectors } as any }
  }

  async highDemandSkills(): Promise<AgentResult> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()

    const { data: searchLogs } = await this.supabase
      .from('search_logs')
      .select('query')
      .gte('created_at', thirtyDaysAgo)

    const freq: Record<string, number> = {}
    const skillKeywords = ['engineer', 'developer', 'data', 'ai', 'machine learning', 'nurse', 'doctor',
      'teacher', 'accountant', 'project manager', 'software', 'cybersecurity', 'cloud',
      'digital marketing', 'finance', 'research', 'analyst', 'consultant', 'architect', 'social worker']

    for (const log of searchLogs || []) {
      const query = (log.query || '').toLowerCase()
      for (const skill of skillKeywords) {
        if (query.includes(skill)) {
          freq[skill] = (freq[skill] || 0) + 1
        }
      }
    }

    const skills = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .map(([skill, count]) => ({ skill, searches: count }))

    const { data: jobs } = await this.supabase
      .from('opportunities')
      .select('title, description')
      .eq('category', 'foreign_job')
      .gte('created_at', thirtyDaysAgo)

    const jobSkillFreq: Record<string, number> = {}
    for (const job of jobs || []) {
      const text = `${job.title || ''} ${job.description || ''}`.toLowerCase()
      for (const skill of skillKeywords) {
        if (text.includes(skill)) {
          jobSkillFreq[skill] = (jobSkillFreq[skill] || 0) + 1
        }
      }
    }

    const inDemand = skillKeywords.map(skill => ({
      skill,
      search_demand: freq[skill] || 0,
      job_mentions: jobSkillFreq[skill] || 0,
      score: Math.round(((freq[skill] || 0) + (jobSkillFreq[skill] || 0) * 2) / 3),
    })).filter(s => s.score > 0).sort((a, b) => b.score - a.score)

    return { success: true, message: 'High-demand skills identified', data: { skills: inDemand.slice(0, 20) } as any }
  }
}
