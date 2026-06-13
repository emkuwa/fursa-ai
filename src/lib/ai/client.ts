import { createHash } from 'crypto'
import { createClient } from '@/lib/supabase/client'

interface AIOptions {
  temperature?: number
  maxTokens?: number
  useCache?: boolean
}

interface AIResponse {
  content: string
  tokensUsed: number
  fromCache: boolean
}

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

const SYSTEM_PROMPTS: Record<string, string> = {
  analysis: `You are an expert opportunity analyst for Fursa AI, an African opportunity intelligence platform.
Analyze opportunities (scholarships, jobs, grants, tenders, fellowships, competitions, internships, exchange programs, startup funding).
Extract: summary, key benefits, eligibility criteria, required documents, deadline urgency (1-100), difficulty score (1-100), quality score (1-100).`,

  categorization: `You are an AI categorization specialist. Given an opportunity, determine its category and generate relevant tags.
Categories: scholarship, foreign_job, grant, tender, fellowship, startup_funding, competition, internship, exchange_program.`,

  translation: `You are a professional translator. Translate the following opportunity content from English to Swahili (Kiswahili).
Provide: full translation, short summary (2-3 sentences), social media version (under 280 chars).`,

  matching: `You are an AI matching specialist. Given a user profile and an opportunity, calculate a match score (0-100).
Consider: education level fit, profession alignment, country relevance, interest overlap, skill match, deadline feasibility.
Provide: match score, match reasons (3-5 bullet points).`,

  application: `You are an expert application assistant for African students and professionals.
Generate high-quality application materials: CV improvements, cover letters, scholarship essays, grant concept notes, personal statements.
Tailor content to the specific opportunity and user background.`,

  marketing: `You are a social media marketing expert for an African opportunity platform.
Create engaging posts for: Facebook, Instagram, LinkedIn, X (Twitter).
Write blog articles and SEO content about opportunities for Africans.
Tone: inspirational, professional, actionable.`,

  seo: `You are an SEO content specialist for an African opportunity platform.
Generate SEO-optimized landing pages for: scholarships, jobs, grants, countries, categories.
Include: meta descriptions, H1 tags, structured content with keywords.
Target: African students and professionals seeking international opportunities.`,
}

function hashPrompt(prompt: string): string {
  return createHash('sha256').update(prompt).digest('hex')
}

export async function callAI(
  prompt: string,
  systemKey: string = 'analysis',
  options: AIOptions = {}
): Promise<AIResponse> {
  const { temperature = 0.3, maxTokens = 2000, useCache = true } = options
  const deepseekApiKey = process.env.DEEPSEEK_API_KEY
  const openrouterApiKey = process.env.OPENROUTER_API_KEY
  const apiKey = deepseekApiKey || openrouterApiKey
  const apiUrl = deepseekApiKey
    ? DEEPSEEK_API_URL
    : process.env.OPENROUTER_API_URL || 'https://openrouter.ai/v1/chat/completions'
  const model = deepseekApiKey ? 'deepseek-chat' : process.env.OPENROUTER_MODEL || 'gpt-4o-mini'
  const provider = deepseekApiKey ? 'DeepSeek' : 'OpenRouter'

  if (!apiKey) {
    return {
      content: JSON.stringify({
        error: 'AI provider API key not configured. Set DEEPSEEK_API_KEY or OPENROUTER_API_KEY.',
        summary: 'AI analysis unavailable',
      }),
      tokensUsed: 0,
      fromCache: false,
    }
  }

  if (useCache) {
    const promptHash = hashPrompt(prompt)
    const supabase = createClient()
    const { data: cached } = await supabase
      .from('ai_cache')
      .select('response, tokens_used')
      .eq('prompt_hash', promptHash)
      .single()

    if (cached) {
      return {
        content: typeof cached.response === 'string' ? cached.response : JSON.stringify(cached.response),
        tokensUsed: cached.tokens_used,
        fromCache: true,
      }
    }
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS[systemKey] || SYSTEM_PROMPTS.analysis },
          { role: 'user', content: prompt },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(`${provider} API error: ${data.error?.message || response.statusText}`)
    }

    const content = data.choices[0]?.message?.content || JSON.stringify(data)
    const tokensUsed = data.usage?.total_tokens || 0

    if (useCache) {
      const promptHash = hashPrompt(prompt)
      const supabase = createClient()
      await supabase.from('ai_cache').insert({
        prompt_hash: promptHash,
        response: { content },
        model,
        tokens_used: tokensUsed,
      }).maybeSingle()
    }

    return { content, tokensUsed, fromCache: false }
  } catch (error) {
    console.error('AI call failed:', error)
    return {
      content: JSON.stringify({
        error: error instanceof Error ? error.message : 'AI call failed',
        summary: 'AI analysis unavailable',
      }),
      tokensUsed: 0,
      fromCache: false,
    }
  }
}

export async function analyzeWithJSON<T>(
  prompt: string,
  systemKey: string = 'analysis',
  options?: AIOptions
): Promise<T | null> {
  const result = await callAI(prompt, systemKey, options)
  try {
    const cleaned = result.content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()
    return JSON.parse(cleaned) as T
  } catch {
    console.error('Failed to parse AI response as JSON:', result.content.slice(0, 200))
    return null
  }
}
