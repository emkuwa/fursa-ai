import { BaseAgent, type AgentResult } from './base-agent'
import { analyzeWithJSON } from '@/lib/ai/client'

interface TranslationResult {
  title_sw: string
  summary_sw: string
  description_sw: string
  social_copy: string
}

export class TranslationAgent extends BaseAgent {
  constructor() {
    super('translation', 2)
  }

  async execute(action: string, payload?: Record<string, unknown>): Promise<AgentResult> {
    switch (action) {
      case 'translate':
        return this.translatePending()
      case 'translate-one':
        return this.translateOpportunity(payload?.opportunityId as string)
      default:
        return { success: false, message: `Unknown action: ${action}` }
    }
  }

  private async translatePending(): Promise<AgentResult> {
    const { data: opportunities } = await this.supabase
      .from('opportunities')
      .select('id, title, description, summary')
      .is('title_sw', null)
      .limit(50)

    if (!opportunities?.length) return { success: true, message: 'No opportunities to translate' }

    let translated = 0
    for (const opp of opportunities) {
      const result = await this.translateWithAI(opp.title, opp.description, opp.summary)
      if (result) {
        await this.supabase
          .from('opportunities')
          .update({
            title_sw: result.title_sw,
            summary_sw: result.summary_sw,
            description_sw: result.description_sw,
            social_copy: result.social_copy,
          })
          .eq('id', opp.id)
        translated++
      }
    }

    return { success: true, message: `Translated ${translated} opportunities to Swahili` }
  }

  private async translateOpportunity(opportunityId?: string): Promise<AgentResult> {
    if (!opportunityId) return { success: false, message: 'No opportunity ID' }

    const { data: opp } = await this.supabase
      .from('opportunities')
      .select('id, title, description, summary')
      .eq('id', opportunityId)
      .single()

    if (!opp) return { success: false, message: 'Not found' }

    const result = await this.translateWithAI(opp.title, opp.description, opp.summary)
    if (!result) return { success: false, message: 'Translation failed' }

    return { success: true, message: 'Translation completed', data: result as unknown as Record<string, unknown> }
  }

  private async translateWithAI(
    title: string,
    description: string,
    summary?: string | null
  ): Promise<TranslationResult | null> {
    const prompt = `Translate this opportunity from English to Swahili:
Title: ${title}
Description: ${description.slice(0, 1500)}
Summary: ${summary || ''}

Return JSON:
{
  "title_sw": "Swahili title",
  "summary_sw": "Short Swahili summary (2-3 sentences)",
  "description_sw": "Full Swahili translation",
  "social_copy": "Social media version under 280 chars in Swahili"
}`

    return analyzeWithJSON<TranslationResult>(prompt, 'translation')
  }
}
