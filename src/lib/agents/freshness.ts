import { BaseAgent, AgentResult } from './base-agent'

export class FreshnessAgent extends BaseAgent {
  constructor() {
    super('freshness', 3)
  }

  async execute(action: string, payload?: Record<string, unknown>): Promise<AgentResult> {
    switch (action) {
      case 'score-all':
        return this.scoreAll()
      case 'archive-expired':
        return this.archiveExpired()
      case 'detect-stale':
        return this.detectStaleSources()
      default:
        return { success: false, message: `Unknown action: ${action}` }
    }
  }

  async scoreAll(): Promise<AgentResult> {
    const { data: opps } = await this.supabase
      .from('opportunities')
      .select('id, deadline, created_at, popularity_score, view_count')
      .in('status', ['approved', 'featured'])

    if (!opps?.length) return { success: true, message: 'No opportunities to score' }

    const now = Date.now()
    let scored = 0

    for (const opp of opps) {
      let freshness = 100

      if (opp.deadline) {
        const deadlineMs = new Date(opp.deadline).getTime()
        const daysLeft = (deadlineMs - now) / 86400000

        if (daysLeft < 0) {
          freshness = 5
        } else if (daysLeft <= 7) {
          freshness = 100
        } else if (daysLeft <= 30) {
          freshness = 80
        } else if (daysLeft <= 90) {
          freshness = 60
        } else {
          freshness = 40
        }
      } else {
        const ageDays = (now - new Date(opp.created_at).getTime()) / 86400000
        if (ageDays <= 7) freshness = 90
        else if (ageDays <= 30) freshness = 70
        else if (ageDays <= 90) freshness = 50
        else freshness = 30
      }

      if (opp.popularity_score) {
        freshness = Math.round(freshness * 0.7 + opp.popularity_score * 0.3)
      }

      await this.supabase.from('opportunities')
        .update({ freshness_score: Math.min(100, freshness) })
        .eq('id', opp.id)
      scored++
    }

    return { success: true, message: `Scored freshness for ${scored} opportunities` }
  }

  async archiveExpired(): Promise<AgentResult> {
    const now = new Date().toISOString()
    const { data: expired, error } = await this.supabase
      .from('opportunities')
      .select('id, title, deadline')
      .lt('deadline', now)
      .in('status', ['approved', 'featured'])

    if (error) return { success: false, message: error.message }
    if (!expired?.length) return { success: true, message: 'No expired opportunities found' }

    let archived = 0
    for (const opp of expired) {
      await this.supabase.from('opportunities')
        .update({ status: 'expired' })
        .eq('id', opp.id)
      archived++
    }

    await this.log(`Archived ${archived} expired opportunities`)
    return { success: true, message: `Archived ${archived} expired opportunities` }
  }

  async detectStaleSources(): Promise<AgentResult> {
    const staleThreshold = new Date(Date.now() - 14 * 86400000).toISOString()
    const { data: staleSources } = await this.supabase
      .from('sources')
      .select('id, name, last_crawled_at')
      .lt('last_crawled_at', staleThreshold)
      .eq('is_active', true)

    if (!staleSources?.length) return { success: true, message: 'No stale sources detected' }

    let flagged = 0
    for (const source of staleSources) {
      await this.supabase.from('source_health').upsert({
        source_id: source.id,
        status: 'degraded',
        last_error: `No collection in 14+ days (last: ${source.last_crawled_at})`,
        checked_at: new Date().toISOString(),
      }).maybeSingle()
      flagged++
    }

    return { success: true, message: `Flagged ${flagged} stale sources as degraded` }
  }
}
