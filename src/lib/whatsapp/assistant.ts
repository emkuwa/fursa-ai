import { createClient } from '@/lib/supabase/client'
import { analyzeWithJSON } from '@/lib/ai/client'

interface IntentResult {
  intent: 'search' | 'subscribe' | 'save' | 'trending' | 'help' | 'unknown'
  categories: string[]
  countries: string[]
  keywords: string[]
  limit: number
}

const WELCOME_MESSAGE = `👋 *Welcome to Fursa AI!*

I'm your AI Opportunity Assistant. I help Africans discover scholarships, jobs, grants, and more.

*Try these commands:*
• "Scholarships in Germany"
• "Engineering jobs in Canada"
• "NGO grants"
• "Top scholarships this week"
• "Save this opportunity"
• "Subscribe to alerts"

Just type what you're looking for!`

export class WhatsAppAssistant {
  private supabase

  constructor(supabaseClient?: ReturnType<typeof createClient>) {
    this.supabase = supabaseClient || supabaseClient || createClient()
  }

  async handleMessage(from: string, body: string): Promise<string> {
    const normalized = body.toLowerCase().trim()

    if (normalized === 'hi' || normalized === 'hello' || normalized === 'start' || normalized === 'menu') {
      return this.getFormattedResponse(WELCOME_MESSAGE, [])
    }

    if (normalized.includes('help')) {
      return this.getHelpMessage()
    }

    if (normalized.includes('subscribe') || normalized.includes('alert')) {
      return this.handleSubscribe(from, body)
    }

    if (normalized.includes('trending') || normalized.includes('top') || normalized.includes('popular')) {
      return this.handleTrendingSearch(normalized)
    }

    return this.handleSearch(from, body)
  }

  private async handleSearch(from: string, body: string): Promise<string> {
    const intent = await this.parseIntent(body)

    if (!intent || intent.intent === 'unknown') {
      return `I didn't quite understand. Try something like:
• "Scholarships in Germany"
• "Jobs in Canada"
• "Engineering grants"
• Type "help" for more options`
    }

    const results = await this.searchOpportunities(intent)

    if (results.length === 0) {
      return `I couldn't find any ${intent.keywords.join(' or ')} opportunities${intent.countries.length ? ` in ${intent.countries.join(', ')}` : ''}${intent.categories.length ? ` for ${intent.categories.join(', ')}` : ''}.

Try different keywords or browse at https://fursaai.com`
    }

    return this.formatResults(results, intent)
  }

  private async handleSubscribe(from: string, _body: string): Promise<string> {
    const { data: existing } = await this.supabase
      .from('user_profiles')
      .select('id')
      .eq('phone', from)
      .maybeSingle()

    if (existing) {
      await this.supabase
        .from('user_profiles')
        .update({ whatsapp_subscribed: true })
        .eq('id', existing.id)

      return `✅ You're now subscribed to WhatsApp alerts! You'll receive daily opportunity digests.

To unsubscribe, reply with "unsubscribe"`
    }

    return `🔔 To subscribe, please first create an account at https://fursaai.com/register with your phone number (${from}), then reply "subscribe" again.`
  }

  private async handleTrendingSearch(normalized: string): Promise<string> {
    let category = ''
    if (normalized.includes('scholarship')) category = 'scholarship'
    else if (normalized.includes('job') || normalized.includes('work')) category = 'foreign_job'
    else if (normalized.includes('grant') || normalized.includes('funding')) category = 'grant'
    else if (normalized.includes('fellowship')) category = 'fellowship'
    else if (normalized.includes('competition')) category = 'competition'

    const query = this.supabase
      .from('opportunities')
      .select('id, title, summary, category, country, ranking_score, deadline, organization')
      .not('ranking_score', 'is', null)
      .in('status', ['approved', 'featured'])
      .order('ranking_score', { ascending: false })
      .limit(5)

    if (category) query.eq('category', category)

    const { data: top } = await query

    if (!top?.length) {
      return 'No trending opportunities found right now. Check back later!'
    }

    let response = `🏆 *Top ${category ? category.replace('_', ' ') : 'Opportunities'}*\n\n`
    for (const opp of top) {
      response += `*${opp.title}*\n`
      response += `📍 ${opp.country || 'Various'} | ${opp.organization || 'N/A'}\n`
      if (opp.deadline) response += `⏰ Deadline: ${new Date(opp.deadline).toLocaleDateString()}\n`
      response += `⭐ Score: ${opp.ranking_score}/100\n`
      response += `🔗 https://fursaai.com/opportunities/${opp.id}\n\n`
    }
    response += `Reply with a search to find more!`

    return response
  }

  private async parseIntent(body: string): Promise<IntentResult | null> {
    return analyzeWithJSON<IntentResult>(`Parse this user message about finding opportunities:
"${body}"

Return JSON:
{
  "intent": "search",
  "categories": ["scholarship"],
  "countries": ["germany"],
  "keywords": ["engineering", "masters"],
  "limit": 5
}

Available categories: scholarship, foreign_job, grant, tender, fellowship, startup_funding, competition, internship, exchange_program
If no specific category, leave array empty.`, 'analysis')
  }

  private async searchOpportunities(intent: IntentResult): Promise<any[]> {
    let query = this.supabase
      .from('opportunities')
      .select('id, title, summary, category, country, organization, ranking_score, quality_score, deadline, url')
      .in('status', ['approved', 'featured'])
      .order('ranking_score', { ascending: false })
      .limit(intent.limit || 5)

    if (intent.categories?.length > 0) {
      query = query.in('category', intent.categories)
    }

    if (intent.countries?.length > 0) {
      const countryConditions = intent.countries.map(c => `country.ilike.%${c}%`).join(',')
      query = query.or(countryConditions)
    }

    if (intent.keywords?.length > 0) {
      const keywordConditions = intent.keywords.map(k => `title.ilike.%${k}%`).join(',')
      query = query.or(keywordConditions)
    }

    const { data } = await query
    return data || []
  }

  private formatResults(results: any[], intent: IntentResult): string {
    let response = `🎯 *Found ${results.length} Opportunities*\n\n`

    for (const opp of results.slice(0, intent.limit || 5)) {
      response += `*${opp.title}*\n`
      response += `📂 ${opp.category.replace('_', ' ')} | 📍 ${opp.country || 'Various'}\n`
      response += `🏢 ${opp.organization || 'N/A'}`
      if (opp.deadline) response += ` | ⏰ ${new Date(opp.deadline).toLocaleDateString()}`
      response += '\n'
      if (opp.summary) response += `📝 ${opp.summary.slice(0, 150)}...\n`
      response += `⭐ Match: ${opp.ranking_score || 'N/A'}/100\n`
      response += `🔗 https://fursaai.com/opportunities/${opp.id}\n\n`
    }

    response += `Reply with:\n`
    response += `• "more" for more results\n`
    response += `• "subscribe" for daily alerts\n`
    response += `• "save [number]" to save an opportunity\n`
    response += `• A new search to try again`

    return response
  }

  private getHelpMessage(): string {
    return `🤖 *Fursa AI Assistant Help*

*Search Examples:*
• "MBA scholarships in USA"
• "Software engineering jobs in Canada"
• "Grants for women entrepreneurs"
• "Fellowships for African researchers"

*Commands:*
• "subscribe" - Get daily WhatsApp alerts
• "trending" - See top opportunities
• "save [number]" - Save an opportunity
• "help" - Show this message

*Tip:* Be specific for better results!
"Engineering jobs in Canada" works better than "jobs"

Visit https://fursaai.com for full features`
  }

  private getFormattedResponse(text: string, _options: { id: string; title: string }[]): string {
    return text
  }
}
