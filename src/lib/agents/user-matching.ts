import { BaseAgent, type AgentResult } from './base-agent'
import { analyzeWithJSON } from '@/lib/ai/client'

interface EnhancedMatchScores {
  match_score: number
  eligibility_score: number
  difficulty_score: number
  success_probability: number
  match_reasons: string[]
}

export class UserMatchingAgent extends BaseAgent {
  constructor() {
    super('user_matching', 2)
  }

  async execute(action: string, payload?: Record<string, unknown>): Promise<AgentResult> {
    switch (action) {
      case 'match-all':
        return this.matchAllUsers()
      case 'match-user':
        return this.matchUser(payload?.userId as string)
      case 'match-opportunity':
        return this.matchOpportunityToUsers(payload?.opportunityId as string)
      case 'calculate-score':
        return this.calculateMatch(payload?.userId as string, payload?.opportunityId as string)
      default:
        return { success: false, message: `Unknown action: ${action}` }
    }
  }

  private async matchAllUsers(): Promise<AgentResult> {
    const { data: users } = await this.supabase
      .from('user_profiles')
      .select('id')
      .eq('is_onboarded', true)

    if (!users?.length) return { success: true, message: 'No users to match' }

    let totalMatches = 0
    for (const user of users) {
      const count = await this.generateMatchesForUser(user.id)
      totalMatches += count
    }

    return { success: true, message: `Generated ${totalMatches} enhanced matches for ${users.length} users` }
  }

  private async matchUser(userId?: string): Promise<AgentResult> {
    if (!userId) return { success: false, message: 'No user ID' }
    const count = await this.generateMatchesForUser(userId)
    return { success: true, message: `Generated ${count} enhanced matches` }
  }

  private async matchOpportunityToUsers(opportunityId?: string): Promise<AgentResult> {
    if (!opportunityId) return { success: false, message: 'No opportunity ID' }

    const { data: opp } = await this.supabase
      .from('opportunities')
      .select('id, title, category, country, eligibility, tags, difficulty_score, quality_score, deadline')
      .eq('id', opportunityId)
      .single()

    if (!opp) return { success: false, message: 'Opportunity not found' }

    const { data: users } = await this.supabase
      .from('user_profiles')
      .select('id, education_level, profession, country, interests, skills, experience_years')
      .eq('is_onboarded', true)
      .limit(100)

    if (!users?.length) return { success: true, message: 'No users to match' }

    let matched = 0
    for (const user of users) {
      const scores = await this.computeEnhancedMatch(opp, user)
      if (scores && scores.match_score >= 30) {
        await this.upsertMatch(user.id, opportunityId, scores)
        matched++
      }
    }

    return { success: true, message: `Matched ${matched} users with enhanced scores` }
  }

  private async generateMatchesForUser(userId: string): Promise<number> {
    const { data: user } = await this.supabase
      .from('user_profiles')
      .select('id, education_level, profession, country, interests, skills, experience_years')
      .eq('id', userId)
      .single()

    if (!user || !user.is_onboarded) return 0

    const { data: opportunities } = await this.supabase
      .from('opportunities')
      .select('id, title, category, country, eligibility, tags, difficulty_score, quality_score, deadline, ranking_score')
      .in('status', ['approved', 'featured'])
      .order('ranking_score', { ascending: false })
      .limit(100)

    if (!opportunities?.length) return 0

    let matches = 0
    for (const opp of opportunities) {
      const scores = await this.computeEnhancedMatch(opp as any, user)
      if (scores && scores.match_score >= 30) {
        await this.upsertMatch(user.id, opp.id, scores)
        matches++
      }
    }

    return matches
  }

  private async computeEnhancedMatch(
    opportunity: any,
    user: any
  ): Promise<EnhancedMatchScores | null> {
    const scores = this.computeRuleBasedScores(opportunity, user)

    if (process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY !== 'placeholder') {
      const aiScores = await this.computeAIScores(opportunity, user)
      if (aiScores) {
        scores.match_score = Math.round(aiScores.match_score * 0.5 + scores.match_score * 0.5)
        scores.eligibility_score = Math.round(aiScores.eligibility_score * 0.6 + scores.eligibility_score * 0.4)
        scores.difficulty_score = aiScores.difficulty_score
        scores.success_probability = aiScores.success_probability
        scores.match_reasons = aiScores.match_reasons
      }
    }

    return scores
  }

  private computeRuleBasedScores(opportunity: any, user: any): EnhancedMatchScores {
    let matchScore = 50
    let eligibilityScore = 50
    const reasons: string[] = []

    if (user.country && opportunity.country) {
      if (opportunity.country.toLowerCase() === user.country.toLowerCase()) {
        matchScore += 10
        eligibilityScore += 10
        reasons.push('📍 Same country opportunity')
      } else {
        matchScore += 8
        eligibilityScore += 5
        reasons.push('✈️ International opportunity')
      }
    }

    if (user.interests?.length && opportunity.tags?.length) {
      const overlap = user.interests.filter((i: string) =>
        opportunity.tags.some((t: string) => t.toLowerCase().includes(i.toLowerCase()))
      ).length
      if (overlap > 0) {
        matchScore += overlap * 8
        eligibilityScore += overlap * 5
        reasons.push(`🎯 Matches ${overlap} of your interests`)
      }
    }

    if (user.skills?.length && opportunity.tags?.length) {
      const skillMatch = user.skills.filter((s: string) =>
        opportunity.tags.some((t: string) => t.toLowerCase().includes(s.toLowerCase()))
      ).length
      if (skillMatch > 0) {
        matchScore += skillMatch * 6
        eligibilityScore += skillMatch * 5
        reasons.push(`💡 Uses ${skillMatch} of your skills`)
      }
    }

    if (user.education_level && opportunity.eligibility) {
      const eduMatch = opportunity.eligibility.toLowerCase().includes(user.education_level.toLowerCase())
      if (eduMatch) {
        matchScore += 10
        eligibilityScore += 15
        reasons.push('🎓 Education level matches')
      }
    }

    if (user.profession && opportunity.eligibility) {
      const profMatch = opportunity.eligibility.toLowerCase().includes(user.profession.toLowerCase())
      if (profMatch) {
        matchScore += 8
        reasons.push('👔 Profession matches')
      }
    }

    if (opportunity.ranking_score) {
      matchScore += opportunity.ranking_score * 0.15
    }

    const difficultyScore = opportunity.difficulty_score || 50
    let successProbability = 60
    if (difficultyScore < 30) successProbability = 85
    else if (difficultyScore < 60) successProbability = 65
    else if (difficultyScore < 80) successProbability = 40
    else successProbability = 20

    if (matchScore > 80) successProbability += 10
    if (eligibilityScore > 70) successProbability += 10

    return {
      match_score: Math.min(100, Math.max(0, Math.round(matchScore))),
      eligibility_score: Math.min(100, Math.max(0, Math.round(eligibilityScore))),
      difficulty_score: difficultyScore,
      success_probability: Math.min(100, Math.max(0, Math.round(successProbability))),
      match_reasons: reasons.slice(0, 5),
    }
  }

  private async computeAIScores(opportunity: any, user: any): Promise<EnhancedMatchScores | null> {
    const prompt = `Calculate match between user and opportunity.

User Profile:
- Education: ${user.education_level || 'Not specified'}
- Profession: ${user.profession || 'Not specified'}
- Country: ${user.country || 'Not specified'}
- Interests: ${(user.interests || []).join(', ')}
- Skills: ${(user.skills || []).join(', ')}
- Experience: ${user.experience_years || 0} years

Opportunity:
- Title: ${opportunity.title}
- Category: ${opportunity.category}
- Country: ${opportunity.country || 'Various'}
- Eligibility: ${(opportunity.eligibility || '').slice(0, 500)}
- Tags: ${(opportunity.tags || []).join(', ')}

Return JSON:
{
  "match_score": 85,
  "eligibility_score": 78,
  "difficulty_score": 45,
  "success_probability": 72,
  "match_reasons": ["Reason 1", "Reason 2", "Reason 3"]
}`

    return analyzeWithJSON<EnhancedMatchScores>(prompt, 'matching')
  }

  private async calculateMatch(userId?: string, opportunityId?: string): Promise<AgentResult> {
    if (!userId || !opportunityId) return { success: false, message: 'Missing user or opportunity ID' }

    const [userRes, oppRes] = await Promise.all([
      this.supabase.from('user_profiles').select('*').eq('id', userId).single(),
      this.supabase.from('opportunities').select('*').eq('id', opportunityId).single(),
    ])

    if (!userRes.data || !oppRes.data) return { success: false, message: 'User or opportunity not found' }

    const scores = await this.computeEnhancedMatch(oppRes.data, userRes.data)
    return {
      success: true,
      message: `Match score: ${scores?.match_score || 0}%`,
      data: scores as any,
    }
  }

  private async upsertMatch(userId: string, opportunityId: string, scores: EnhancedMatchScores): Promise<void> {
    await this.supabase
      .from('user_matches')
      .upsert({
        user_id: userId,
        opportunity_id: opportunityId,
        match_score: scores.match_score,
        eligibility_score: scores.eligibility_score,
        difficulty_score: scores.difficulty_score,
        success_probability: scores.success_probability,
        match_reasons: scores.match_reasons,
      }, { onConflict: 'user_id,opportunity_id' })
  }
}
