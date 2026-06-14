import { BaseAgent, type AgentResult } from './base-agent'
import { createHash } from 'crypto'
import { getScrapingProvider, type ScrapedOpportunity } from '@/lib/scraping/provider'

const scrapingProvider = getScrapingProvider()

export class OpportunityCollectionAgent extends BaseAgent {
  constructor() {
    super('opportunity_collection', 3)
  }

  async execute(action: string, payload?: Record<string, unknown>): Promise<AgentResult> {
    switch (action) {
      case 'collect':
        return this.collectFromAllSources()
      case 'collect-source':
        return this.collectFromSource(payload?.sourceId as string)
      case 'fetch-rss':
        return this.fetchFromRSS(payload?.url as string)
      case 'promote':
        return this.promoteFromRaw()
      default:
        return { success: false, message: `Unknown action: ${action}` }
    }
  }

  private async collectFromAllSources(): Promise<AgentResult> {
    const { data: sources } = await this.supabase
      .from('sources')
      .select('id, url, name, type')
      .eq('is_active', true)
      .order('quality_score', { ascending: false })

    if (!sources?.length) return { success: true, message: 'No active sources found' }

    let total = 0
    for (const source of sources) {
      try {
        const result = await this.scrapeSource(source)
        if (result > 0) {
          await this.supabase
            .from('sources')
            .update({ last_crawled_at: new Date().toISOString() })
            .eq('id', source.id)
        }
        total += result
      } catch (error) {
        await this.log(`Failed to scrape ${source.url}: ${error}`, 'error')
      }
    }

    return { success: true, message: `Collected ${total} opportunities from ${sources.length} sources` }
  }

  private async collectFromSource(sourceId: string): Promise<AgentResult> {
    const { data: source } = await this.supabase
      .from('sources')
      .select('id, url, name, type')
      .eq('id', sourceId)
      .single()

    if (!source) return { success: false, message: 'Source not found' }

    const count = await this.scrapeSource(source)
    return { success: true, message: `Collected ${count} opportunities from ${source.name}` }
  }

  private async scrapeSource(source: { id: string; url: string; name: string; type: string }): Promise<number> {
    await this.log(`Scraping ${source.name} at ${source.url} using ${scrapingProvider.providerName}`)

    const opportunities = await scrapingProvider.scrapeSource(source)
    if (!opportunities.length) {
      await this.log(`No opportunities extracted for ${source.name}`)
      return 0
    }

    let count = 0
    for (const opp of opportunities) {
      const hash = createHash('sha256')
        .update(opp.title + opp.url)
        .digest('hex')

      const { error } = await this.supabase
        .from('raw_opportunities')
        .insert({
          source_id: source.id,
          external_id: opp.externalId,
          title: opp.title,
          description: opp.description,
          url: opp.url,
          deadline: opp.deadline,
          country: opp.country,
          category: opp.category as any,
          organization: opp.organization,
          eligibility: opp.eligibility,
          raw_html: opp.rawHtml,
          hash,
        })

      if (!error) count++
    }

    return count
  }

  private async fetchFromRSS(url: string): Promise<AgentResult> {
    await this.log(`Fetching RSS from ${url}`)

    if (!url) return { success: false, message: 'No RSS URL provided' }

    try {
      const feedItems = scrapingProvider.scrapeFeed ? await scrapingProvider.scrapeFeed(url) : []
      return { success: true, message: `Parsed ${feedItems.length} RSS items from ${url}` }
    } catch (error) {
      await this.log(`RSS fetch failed for ${url}: ${error}`, 'error')
      return { success: false, message: `RSS fetch failed: ${error}` }
    }
  }

  private async promoteFromRaw(): Promise<AgentResult> {
    await this.log('Starting raw→opportunities promotion')

    const { data: rawOpps, error: fetchError } = await this.supabase
      .from('raw_opportunities')
      .select('id, source_id, title, description, url, deadline, country, category, organization, eligibility, hash')

    if (fetchError) return { success: false, message: `Failed to fetch raw opportunities: ${fetchError.message}` }
    if (!rawOpps?.length) return { success: true, message: 'No raw opportunities to promote', data: { promoted: 0, skipped: 0, duplicates: 0 } as any }

    const { data: existingOpps } = await this.supabase
      .from('opportunities')
      .select('title, url, hash')

    const existingTitles = new Set((existingOpps || []).map((r: any) => `${r.title}|||${r.url}`))
    const existingHashes = new Set((existingOpps || []).map((r: any) => r.hash).filter(Boolean))

    let promoted = 0
    let skippedMissing = 0
    let duplicates = 0
    const sample: any[] = []

    for (const raw of rawOpps) {
      if (!raw.title || !raw.url) {
        skippedMissing++
        continue
      }

      if (existingHashes.has(raw.hash) || existingTitles.has(`${raw.title}|||${raw.url}`)) {
        duplicates++
        continue
      }

      const { error: insertError } = await this.supabase
        .from('opportunities')
        .insert({
          source_id: raw.source_id,
          title: raw.title,
          description: raw.description,
          summary: raw.description?.slice(0, 200) || null,
          url: raw.url,
          application_link: raw.url,
          deadline: raw.deadline,
          country: raw.country,
          category: raw.category || 'scholarship',
          organization: raw.organization,
          eligibility: raw.eligibility,
          status: 'pending',
          quality_score: 50,
        })

      if (!insertError) {
        existingHashes.add(raw.hash)
        existingTitles.add(`${raw.title}|||${raw.url}`)
        promoted++
        if (sample.length < 5) {
          sample.push({ title: raw.title, organization: raw.organization, category: raw.category, country: raw.country })
        }
      }
    }

    await this.log(`Promotion complete: ${promoted} promoted, ${duplicates} duplicates skipped, ${skippedMissing} missing fields`)

    return {
      success: true,
      message: `Promoted ${promoted} opportunities from raw (${duplicates} duplicates, ${skippedMissing} skipped)`,
      data: { promoted, duplicates, skipped: skippedMissing, totalRaw: rawOpps.length, sample } as any,
    }
  }
}
