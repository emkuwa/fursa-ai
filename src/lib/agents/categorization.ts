import { BaseAgent, type AgentResult } from './base-agent'
import { analyzeWithJSON } from '@/lib/ai/client'

interface CategoryResult {
  category: string
  tags: string[]
}

const KEYWORD_RULES: Record<string, { keywords: string[]; tags: string[] }> = {
  scholarship: {
    keywords: ['scholarship', 'study', 'tuition', 'bachelor', 'master', 'phd', 'undergraduate', 'graduate', 'full funding', 'bursary'],
    tags: ['education', 'study abroad', 'funding'],
  },
  foreign_job: {
    keywords: ['job', 'career', 'employment', 'vacancy', 'hiring', 'position', 'work abroad', 'relocation', 'visa sponsorship'],
    tags: ['career', 'employment', 'international'],
  },
  grant: {
    keywords: ['grant', 'funding', 'research grant', 'project funding', 'seed funding', 'innovation fund'],
    tags: ['funding', 'research', 'innovation'],
  },
  tender: {
    keywords: ['tender', 'bid', 'procurement', 'RFP', 'request for proposal', 'contract', 'supplier'],
    tags: ['business', 'procurement', 'contract'],
  },
  fellowship: {
    keywords: ['fellowship', 'research fellowship', 'postdoc', 'academic fellowship', 'professional fellowship'],
    tags: ['research', 'professional development', 'academic'],
  },
  startup_funding: {
    keywords: ['startup', 'venture capital', 'angel investor', 'accelerator', 'incubator', 'seed round', 'series a'],
    tags: ['startup', 'venture', 'entrepreneurship'],
  },
  competition: {
    keywords: ['competition', 'contest', 'hackathon', 'challenge', 'prize', 'award', 'competition'],
    tags: ['competition', 'award', 'recognition'],
  },
  internship: {
    keywords: ['internship', 'intern', 'trainee', 'work experience', 'summer program'],
    tags: ['internship', 'experience', 'training'],
  },
  exchange_program: {
    keywords: ['exchange', 'study abroad', 'cultural exchange', 'student exchange', 'international exchange'],
    tags: ['exchange', 'cultural', 'international'],
  },
}

export class CategorizationAgent extends BaseAgent {
  constructor() {
    super('categorization', 2)
  }

  async execute(action: string, payload?: Record<string, unknown>): Promise<AgentResult> {
    switch (action) {
      case 'categorize':
        return this.categorizePending()
      case 'categorize-one':
        return this.categorizeOpportunity(payload?.opportunityId as string)
      default:
        return { success: false, message: `Unknown action: ${action}` }
    }
  }

  private async categorizePending(): Promise<AgentResult> {
    const { data: opportunities } = await this.supabase
      .from('opportunities')
      .select('id, title, description, category')
      .is('tags', null)
      .limit(100)

    if (!opportunities?.length) return { success: true, message: 'No uncategorized opportunities' }

    let categorized = 0
    for (const opp of opportunities) {
      const result = this.categorizeByKeywords(opp.title, opp.description)
      if (result) {
        await this.supabase
          .from('opportunities')
          .update({
            category: result.category as any,
            tags: result.tags,
          })
          .eq('id', opp.id)
        categorized++
      }
    }

    return { success: true, message: `Categorized ${categorized} opportunities` }
  }

  private async categorizeOpportunity(opportunityId?: string): Promise<AgentResult> {
    if (!opportunityId) return { success: false, message: 'No opportunity ID' }

    const { data: opp } = await this.supabase
      .from('opportunities')
      .select('id, title, description')
      .eq('id', opportunityId)
      .single()

    if (!opp) return { success: false, message: 'Not found' }

    const result = this.categorizeByKeywords(opp.title, opp.description)

    // Also use AI for better categorization
    const aiResult = await this.categorizeWithAI(opp.title, opp.description)

    const finalCategory = result?.category || aiResult?.category || 'scholarship'
    const finalTags = [...new Set([...(result?.tags || []), ...(aiResult?.tags || [])])]

    return {
      success: true,
      message: `Categorized as ${finalCategory}`,
      data: { category: finalCategory, tags: finalTags } as unknown as Record<string, unknown>,
    }
  }

  private categorizeByKeywords(title: string, description: string): CategoryResult | null {
    const text = `${title} ${description}`.toLowerCase()

    for (const [category, rule] of Object.entries(KEYWORD_RULES)) {
      for (const keyword of rule.keywords) {
        if (text.includes(keyword.toLowerCase())) {
          return { category, tags: rule.tags }
        }
      }
    }

    return null
  }

  private async categorizeWithAI(title: string, description: string): Promise<CategoryResult | null> {
    const prompt = `Categorize this opportunity:
Title: ${title}
Description: ${description.slice(0, 1000)}

Return JSON:
{
  "category": "scholarship|foreign_job|grant|tender|fellowship|startup_funding|competition|internship|exchange_program",
  "tags": ["tag1", "tag2", "tag3"]
}`

    return analyzeWithJSON<CategoryResult>(prompt, 'categorization')
  }
}
