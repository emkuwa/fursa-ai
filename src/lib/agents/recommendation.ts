import { BaseAgent, AgentResult } from './base-agent'

export class RecommendationAgent extends BaseAgent {
  constructor() {
    super('recommendation', 3)
  }

  async execute(action: string, payload?: Record<string, unknown>): Promise<AgentResult> {
    switch (action) {
      case 'recommend':
        return this.recommend(payload?.userId as string, payload?.limit as number || 10)
      case 'recommend-all':
        return this.recommendAll()
      case 'dismiss':
        return this.dismiss(payload?.userId as string, payload?.opportunityId as string)
      default:
        return { success: false, message: `Unknown action: ${action}` }
    }
  }

  async recommend(userId: string, limit = 10): Promise<AgentResult> {
    let recommendations: { opportunity_id: string; score: number; reason: string; source_type: string }[] = []

    const [recentViews, savedOpps, userProfile, trendingOpps] = await Promise.all([
      this.supabase.from('analytics_events').select('opportunity_id, category')
        .eq('user_id', userId).eq('event_type', 'view').order('created_at', { ascending: false }).limit(20),
      this.supabase.from('user_matches').select('opportunity_id').eq('user_id', userId).eq('is_saved', true),
      this.supabase.from('user_profiles').select('*').eq('id', userId).single(),
      this.supabase.from('opportunities').select('id')
        .in('status', ['approved', 'featured']).order('view_count', { ascending: false }).limit(50),
    ])

    const viewedIds = new Set((recentViews.data || []).map((v: any) => v.opportunity_id))
    const savedIds = new Set((savedOpps.data || []).map((s: any) => s.opportunity_id))
    const profile = userProfile.data

    // 1. From viewed categories
    const viewedCats = [...new Set((recentViews.data || []).map((v: any) => v.category).filter(Boolean))]
    if (viewedCats.length > 0) {
      const { data } = await this.supabase.from('opportunities').select('id, title, view_count')
        .in('category', viewedCats).in('status', ['approved', 'featured'])
        .order('ranking_score', { ascending: false }).limit(20)

      for (const opp of data || []) {
        if (!viewedIds.has(opp.id) && !savedIds.has(opp.id)) {
          recommendations.push({
            opportunity_id: opp.id,
            score: 80 + Math.round((opp.view_count || 0) / 10),
            reason: 'Based on your browsing history',
            source_type: 'search_history',
          })
        }
      }
    }

    // 2. From profile match
    if (profile?.interests?.length || profile?.country) {
      let query = this.supabase.from('opportunities').select('id').in('status', ['approved', 'featured'])
      if (profile.interests?.length) query = query.overlaps('tags', profile.interests)
      if (profile.country) query = query.eq('country', profile.country)
      const { data } = await query.order('ranking_score', { ascending: false }).limit(20)

      for (const opp of data || []) {
        if (!recommendations.some(r => r.opportunity_id === opp.id)) {
          recommendations.push({
            opportunity_id: opp.id,
            score: 75,
            reason: 'Matches your profile',
            source_type: 'profile_match',
          })
        }
      }
    }

    // 3. Trending opportunities
    for (const opp of (trendingOpps.data || []).slice(0, 10)) {
      if (!recommendations.some(r => r.opportunity_id === opp.id)) {
        recommendations.push({
          opportunity_id: opp.id,
          score: 65,
          reason: 'Trending now',
          source_type: 'trending',
        })
      }
    }

    // Deduplicate and trim
    const seen = new Set<string>()
    recommendations = recommendations.filter(r => {
      if (seen.has(r.opportunity_id)) return false
      seen.add(r.opportunity_id)
      return true
    }).slice(0, limit)

    // Store recommendations
    const existing = await this.supabase.from('recommendations').select('opportunity_id')
      .eq('user_id', userId)

    const existingIds = new Set((existing.data || []).map((e: any) => e.opportunity_id))

    for (const rec of recommendations) {
      if (!existingIds.has(rec.opportunity_id)) {
        await this.supabase.from('recommendations').insert({
          user_id: userId,
          opportunity_id: rec.opportunity_id,
          score: rec.score,
          reason: rec.reason,
          source_type: rec.source_type,
        }).maybeSingle()
      }
    }

    return { success: true, message: `Generated ${recommendations.length} recommendations`, data: { recommendations } as any }
  }

  async recommendAll(): Promise<AgentResult> {
    const { data: users } = await this.supabase.from('user_profiles').select('id')

    let total = 0
    for (const user of users || []) {
      const result = await this.recommend(user.id, 10)
      if (result.success) total++
    }

    return { success: true, message: `Generated recommendations for ${total} users` }
  }

  private async dismiss(userId: string, opportunityId: string): Promise<AgentResult> {
    const { error } = await this.supabase.from('recommendations')
      .update({ is_dismissed: true }).match({ user_id: userId, opportunity_id: opportunityId })

    if (error) return { success: false, message: error.message }
    return { success: true, message: 'Recommendation dismissed' }
  }
}
