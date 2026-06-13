import { BaseAgent, AgentResult } from './base-agent'

export class PremiumConversionAgent extends BaseAgent {
  constructor() {
    super('premium_conversion', 3)
  }

  async execute(action: string, payload?: Record<string, unknown>): Promise<AgentResult> {
    switch (action) {
      case 'score-users':
        return this.scoreAllUsers()
      case 'score-user':
        return this.scoreUser(payload?.userId as string)
      case 'get-leads':
        return this.getLeads(payload?.stage as string)
      case 'generate-prompts':
        return this.generatePrompts(payload?.userId as string)
      default:
        return { success: false, message: `Unknown action: ${action}` }
    }
  }

  async scoreUser(userId: string): Promise<AgentResult> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()

    const [profileRes, searchCountRes, viewCountRes, saveCountRes, alertOpenRes, appCountRes] = await Promise.all([
      this.supabase.from('user_profiles').select('plan_tier, created_at, match_count, application_count')
        .eq('id', userId).single(),
      this.supabase.from('search_logs').select('id', { count: 'exact', head: true })
        .eq('user_id', userId).gte('created_at', sevenDaysAgo),
      this.supabase.from('analytics_events').select('id', { count: 'exact', head: true })
        .eq('user_id', userId).eq('event_type', 'view').gte('created_at', sevenDaysAgo),
      this.supabase.from('analytics_events').select('id', { count: 'exact', head: true })
        .eq('user_id', userId).eq('event_type', 'save').gte('created_at', sevenDaysAgo),
      this.supabase.from('analytics_events').select('id', { count: 'exact', head: true })
        .eq('user_id', userId).eq('event_type', 'alert_open').gte('created_at', sevenDaysAgo),
      this.supabase.from('user_matches').select('id', { count: 'exact', head: true })
        .eq('user_id', userId).eq('is_applied', true).gte('created_at', thirtyDaysAgo),
    ])

    const profile = profileRes.data
    if (!profile) return { success: false, message: 'User not found' }
    if (profile.plan_tier !== 'free') return { success: true, message: 'User already on paid plan' }

    const signals: string[] = []
    let score = 0

    const searches = searchCountRes.count || 0
    const views = viewCountRes.count || 0
    const saves = saveCountRes.count || 0
    const alertOpens = alertOpenRes.count || 0
    const applications = appCountRes.count || 0

    if (searches >= 10) { score += 20; signals.push(`Frequent searcher (${searches} searches/week)`) }
    if (views >= 20) { score += 15; signals.push(`High engagement (${views} views/week)`) }
    if (saves >= 5) { score += 20; signals.push(`Active saver (${saves} saves/week)`) }
    if (alertOpens >= 3) { score += 15; signals.push(`Alert responsive (${alertOpens} opens/week)`) }
    if (applications >= 2) { score += 20; signals.push(`Active applicant (${applications} applications)`) }
    if (profile.match_count && profile.match_count >= 20) { score += 10; signals.push('High match count') }

    const accountAge = (Date.now() - new Date(profile.created_at).getTime()) / 86400000
    if (accountAge >= 14) { score += 10; signals.push('Engaged for 2+ weeks') }

    score = Math.min(score, 100)

    let stage: 'cold' | 'warm' | 'hot' = 'cold'
    if (score >= 60) stage = 'hot'
    else if (score >= 30) stage = 'warm'

    const { data: existing } = await this.supabase.from('upgrade_leads')
      .select('id').eq('user_id', userId).maybeSingle()

    if (existing) {
      await this.supabase.from('upgrade_leads').update({
        score, signals, stage,
      }).eq('id', existing.id)
    } else {
      await this.supabase.from('upgrade_leads').insert({
        user_id: userId, score, signals, stage, plan_tier: 'premium',
      }).maybeSingle()
    }

    return {
      success: true,
      message: `User scored: ${score}/100 (${stage})`,
      data: { score, stage, signals } as any,
    }
  }

  async scoreAllUsers(): Promise<AgentResult> {
    const { data: freeUsers } = await this.supabase.from('user_profiles')
      .select('id').eq('plan_tier', 'free')

    let total = 0
    for (const user of freeUsers || []) {
      const result = await this.scoreUser(user.id)
      if (result.success) total++
    }

    return { success: true, message: `Scored ${total} free users` }
  }

  private async getLeads(stage?: string): Promise<AgentResult> {
    let query = this.supabase.from('upgrade_leads')
      .select('*, user_profiles!inner(full_name, email)')
      .order('score', { ascending: false })

    if (stage) query = query.eq('stage', stage)

    const { data, error } = await query

    if (error) return { success: false, message: error.message }
    return { success: true, message: `Found ${data?.length || 0} leads`, data: { leads: data } as any }
  }

  private async generatePrompts(userId?: string): Promise<AgentResult> {
    let query = this.supabase.from('upgrade_leads')
      .select('*').eq('stage', 'hot').lte('prompt_count', 3)

    if (userId) query = query.eq('user_id', userId)

    const { data: leads } = await query

    let prompted = 0
    for (const lead of leads || []) {
      await this.supabase.from('upgrade_leads').update({
        prompted_at: new Date().toISOString(),
        prompt_count: (lead.prompt_count || 0) + 1,
      }).eq('id', lead.id)

      prompted++
    }

    return { success: true, message: `Generated prompts for ${prompted} leads`, data: { prompted } as any }
  }
}
