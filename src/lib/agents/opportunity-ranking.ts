import { BaseAgent, type AgentResult } from './base-agent'
import { analyzeWithJSON } from '@/lib/ai/client'

interface RankingScores {
  ranking_score: number
  urgency_score: number
  popularity_score: number
  funding_score: number
  career_impact_score: number
}

export class OpportunityRankingAgent extends BaseAgent {
  constructor() {
    super('opportunity_ranking', 2)
  }

  async execute(action: string, payload?: Record<string, unknown>): Promise<AgentResult> {
    switch (action) {
      case 'rank-all':
        return this.rankAllOpportunities()
      case 'rank-category':
        return this.rankCategory(payload?.category as string)
      case 'rank-one':
        return this.rankOpportunity(payload?.opportunityId as string)
      case 'get-top':
        return this.getTopRanked(payload?.category as string, (payload?.limit as number) || 10)
      default:
        return { success: false, message: `Unknown action: ${action}` }
    }
  }

  private async rankAllOpportunities(): Promise<AgentResult> {
    const categories = ['scholarship', 'foreign_job', 'grant', 'tender', 'fellowship', 'startup_funding', 'competition', 'internship', 'exchange_program']
    let ranked = 0

    for (const category of categories) {
      const { data: opportunities } = await this.supabase
        .from('opportunities')
        .select('id, title, description, deadline, deadline_urgency, quality_score, difficulty_score, view_count, application_count, save_count, category, country')
        .eq('category', category)
        .in('status', ['approved', 'featured'])
        .order('created_at', { ascending: false })
        .limit(200)

      if (!opportunities?.length) continue

      const rankedOpps = await this.rankOpportunities(category, opportunities)
      for (const opp of rankedOpps) {
        await this.supabase
          .from('opportunities')
          .update({
            ranking_score: opp.ranking_score,
            urgency_score: opp.urgency_score,
            popularity_score: opp.popularity_score,
            funding_score: opp.funding_score,
            career_impact_score: opp.career_impact_score,
          })
          .eq('id', opp.id)

        await this.supabase
          .from('opportunity_rankings')
          .upsert({
            opportunity_id: opp.id,
            ranking_date: new Date().toISOString().split('T')[0],
            category: opp.category,
            rank: opp.rank,
            ranking_score: opp.ranking_score,
            urgency_score: opp.urgency_score,
            popularity_score: opp.popularity_score,
            funding_score: opp.funding_score,
            career_impact_score: opp.career_impact_score,
          }).maybeSingle()

        ranked++
      }
    }

    return { success: true, message: `Ranked ${ranked} opportunities across ${categories.length} categories` }
  }

  private async rankCategory(category?: string): Promise<AgentResult> {
    if (!category) return { success: false, message: 'No category provided' }

    const { data: opportunities } = await this.supabase
      .from('opportunities')
      .select('id, title, description, deadline, deadline_urgency, quality_score, difficulty_score, view_count, application_count, save_count, category, country')
      .eq('category', category)
      .in('status', ['approved', 'featured'])
      .order('created_at', { ascending: false })
      .limit(200)

    if (!opportunities?.length) return { success: true, message: `No opportunities in ${category}` }

    const ranked = await this.rankOpportunities(category, opportunities)
    for (const opp of ranked) {
      await this.supabase.from('opportunities').update({
        ranking_score: opp.ranking_score,
        urgency_score: opp.urgency_score,
        popularity_score: opp.popularity_score,
        funding_score: opp.funding_score,
        career_impact_score: opp.career_impact_score,
      }).eq('id', opp.id)
    }

    return { success: true, message: `Ranked ${ranked.length} ${category} opportunities` }
  }

  private async rankOpportunity(opportunityId?: string): Promise<AgentResult> {
    if (!opportunityId) return { success: false, message: 'No opportunity ID' }

    const { data: opp } = await this.supabase
      .from('opportunities')
      .select('*')
      .eq('id', opportunityId)
      .single()

    if (!opp) return { success: false, message: 'Opportunity not found' }

    const scores = await this.computeAIRanking(opp)
    await this.supabase
      .from('opportunities')
      .update({
        ranking_score: scores.ranking_score,
        urgency_score: scores.urgency_score,
        popularity_score: scores.popularity_score,
        funding_score: scores.funding_score,
        career_impact_score: scores.career_impact_score,
      })
      .eq('id', opportunityId)

    return { success: true, message: 'Ranking completed', data: scores as unknown as Record<string, unknown> }
  }

  private async getTopRanked(category?: string, limit = 10): Promise<AgentResult> {
    const query = this.supabase
      .from('opportunities')
      .select('id, title, summary, category, country, ranking_score, urgency_score, deadline, organization, url')
      .not('ranking_score', 'is', null)
      .in('status', ['approved', 'featured'])
      .order('ranking_score', { ascending: false })
      .limit(limit)

    if (category) query.eq('category', category)

    const { data: top } = await query

    return {
      success: true,
      message: `Top ${limit} ranked opportunities`,
      data: { top: top || [], category, limit },
    }
  }

  private async rankOpportunities(
    category: string,
    opportunities: any[]
  ): Promise<(any & { rank: number })[]> {
    const scored = await Promise.all(
      opportunities.map(async (opp) => {
        const scores = await this.computeAIRanking(opp)
        return { ...opp, ...scores }
      })
    )

    scored.sort((a, b) => b.ranking_score - a.ranking_score)
    return scored.map((opp, i) => ({ ...opp, rank: i + 1 }))
  }

  private async computeAIRanking(opportunity: any): Promise<RankingScores> {
    const ruleScores = this.computeRuleBasedScores(opportunity)

    if (process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY !== 'placeholder') {
      const aiScores = await this.computeAIScores(opportunity)
      if (aiScores) {
        return {
          ranking_score: Math.round(aiScores.ranking_score * 0.6 + ruleScores.ranking_score * 0.4),
          urgency_score: Math.round(aiScores.urgency_score * 0.5 + ruleScores.urgency_score * 0.5),
          popularity_score: Math.round(aiScores.popularity_score * 0.7 + ruleScores.popularity_score * 0.3),
          funding_score: Math.round(aiScores.funding_score * 0.6 + ruleScores.funding_score * 0.4),
          career_impact_score: Math.round(aiScores.career_impact_score * 0.7 + ruleScores.career_impact_score * 0.3),
        }
      }
    }

    return ruleScores
  }

  private computeRuleBasedScores(opportunity: any): RankingScores {
    const now = new Date().getTime()

    let urgency = 50
    if (opportunity.deadline) {
      const daysLeft = (new Date(opportunity.deadline).getTime() - now) / 86400000
      if (daysLeft < 0) urgency = 0
      else if (daysLeft <= 7) urgency = 95
      else if (daysLeft <= 30) urgency = 75
      else if (daysLeft <= 90) urgency = 50
      else urgency = 25
    }

    let popularity = 30
    if (opportunity.view_count > 0) popularity += Math.min(40, opportunity.view_count)
    if (opportunity.save_count > 0) popularity += Math.min(20, opportunity.save_count * 5)
    if (opportunity.application_count > 0) popularity += Math.min(10, opportunity.application_count * 3)

    let funding = 50
    if (['scholarship', 'grant', 'startup_funding'].includes(opportunity.category)) {
      funding = 70
      if (opportunity.quality_score && opportunity.quality_score >= 80) funding += 15
    } else if (['foreign_job', 'fellowship'].includes(opportunity.category)) {
      funding = 55
    }

    let careerImpact = 50
    if (['scholarship', 'fellowship', 'exchange_program'].includes(opportunity.category)) careerImpact = 75
    else if (['foreign_job', 'internship'].includes(opportunity.category)) careerImpact = 70
    else if (['startup_funding', 'grant'].includes(opportunity.category)) careerImpact = 60

    if (opportunity.difficulty_score) {
      careerImpact -= opportunity.difficulty_score > 80 ? 10 : 0
    }

    const total = Math.round(urgency * 0.2 + popularity * 0.25 + funding * 0.25 + careerImpact * 0.3)

    return {
      ranking_score: Math.min(100, Math.max(0, total)),
      urgency_score: Math.min(100, Math.max(0, urgency)),
      popularity_score: Math.min(100, Math.max(0, popularity)),
      funding_score: Math.min(100, Math.max(0, funding)),
      career_impact_score: Math.min(100, Math.max(0, careerImpact)),
    }
  }

  private async computeAIScores(opportunity: any): Promise<RankingScores | null> {
    const prompt = `Score this ${opportunity.category} opportunity on 5 dimensions (0-100 each):
Title: ${opportunity.title}
Description: ${(opportunity.description || '').slice(0, 1000)}
Country: ${opportunity.country || 'Various'}
Deadline: ${opportunity.deadline || 'Open'}
Quality Score: ${opportunity.quality_score || 'N/A'}

Return JSON:
{
  "ranking_score": 75,
  "urgency_score": 60,
  "popularity_score": 70,
  "funding_score": 80,
  "career_impact_score": 85
}

Where:
- ranking_score: Overall opportunity quality
- urgency_score: How time-sensitive
- popularity_score: How sought-after
- funding_score: Financial value
- career_impact_score: Long-term career benefit`

    return analyzeWithJSON<RankingScores>(prompt, 'analysis')
  }
}
