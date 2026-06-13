import { BaseAgent, type AgentResult } from './base-agent'
import { analyzeWithJSON } from '@/lib/ai/client'

interface AnalysisResult {
  summary: string
  key_benefits: string
  eligibility: string
  required_documents: string[]
  deadline_urgency: number
  difficulty_score: number
  quality_score: number
}

export class OpportunityAnalysisAgent extends BaseAgent {
  constructor() {
    super('opportunity_analysis', 3)
  }

  async execute(action: string, payload?: Record<string, unknown>): Promise<AgentResult> {
    switch (action) {
      case 'analyze':
        return this.analyzePending()
      case 'analyze-one':
        return this.analyzeOpportunity(payload?.opportunityId as string)
      default:
        return { success: false, message: `Unknown action: ${action}` }
    }
  }

  private async analyzePending(): Promise<AgentResult> {
    const { data: opportunities } = await this.supabase
      .from('opportunities')
      .select('id, title, description, url, deadline, country, organization')
      .is('quality_score', null)
      .limit(50)

    if (!opportunities?.length) return { success: true, message: 'No pending opportunities to analyze' }

    let analyzed = 0
    for (const opp of opportunities) {
      const result = await this.analyzeWithAI(opp)
      if (result) {
        await this.supabase
          .from('opportunities')
          .update({
            summary: result.summary,
            benefits: result.key_benefits,
            eligibility: result.eligibility,
            required_documents: result.required_documents,
            deadline_urgency: result.deadline_urgency,
            difficulty_score: result.difficulty_score,
            quality_score: result.quality_score,
          })
          .eq('id', opp.id)
        analyzed++
      }
    }

    return { success: true, message: `Analyzed ${analyzed} opportunities` }
  }

  private async analyzeOpportunity(opportunityId?: string): Promise<AgentResult> {
    if (!opportunityId) return { success: false, message: 'No opportunity ID provided' }

    const { data: opp } = await this.supabase
      .from('opportunities')
      .select('id, title, description, url, deadline, country, organization')
      .eq('id', opportunityId)
      .single()

    if (!opp) return { success: false, message: 'Opportunity not found' }

    const result = await this.analyzeWithAI(opp)
    if (!result) return { success: false, message: 'Analysis failed' }

    return { success: true, message: 'Analysis completed', data: result as unknown as Record<string, unknown> }
  }

  private async analyzeWithAI(opportunity: {
    title: string
    description: string
    url: string
    deadline?: string | null
    country?: string | null
    organization?: string | null
  }): Promise<AnalysisResult | null> {
    const prompt = `Analyze this opportunity:
Title: ${opportunity.title}
Description: ${opportunity.description.slice(0, 2000)}
URL: ${opportunity.url}
Deadline: ${opportunity.deadline || 'Not specified'}
Country: ${opportunity.country || 'Not specified'}
Organization: ${opportunity.organization || 'Not specified'}

Return JSON:
{
  "summary": "2-3 sentence summary",
  "key_benefits": "Key benefits of this opportunity",
  "eligibility": "Eligibility criteria",
  "required_documents": ["document1", "document2"],
  "deadline_urgency": 50,
  "difficulty_score": 50,
  "quality_score": 70
}`

    return analyzeWithJSON<AnalysisResult>(prompt, 'analysis')
  }
}
