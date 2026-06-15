import { getSourceProfile } from '@/lib/scraping/source-profiles'

export type ScrapingProviderName = 'webbridge' | 'http' | 'stub'

export interface ScrapedOpportunity {
  externalId?: string
  title: string
  description: string
  url: string
  deadline?: string
  country?: string
  category?: string
  organization?: string
  eligibility?: string
  applicationLink?: string
  rawHtml?: string
}

export interface SourceRecord {
  id: string
  url: string
  name: string
  type: string
}

export interface ScrapingProvider {
  providerName: ScrapingProviderName
  fetchPage(url: string): Promise<string>
  scrapeSource(source: SourceRecord): Promise<ScrapedOpportunity[]>
  scrapeFeed?(url: string): Promise<ScrapedOpportunity[]>
}

const KIMI_WEBBRIDGE_ENDPOINT = process.env.KIMI_WEBBRIDGE_ENDPOINT || ''
const KIMI_WEBBRIDGE_API_KEY = process.env.KIMI_WEBBRIDGE_API_KEY || ''
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

export function hasWebBridgeConfig(): boolean {
  return Boolean(KIMI_WEBBRIDGE_ENDPOINT && KIMI_WEBBRIDGE_API_KEY)
}

export class WebBridgeScrapingProvider implements ScrapingProvider {
  providerName: ScrapingProviderName = 'webbridge'

  async fetchPage(url: string): Promise<string> {
    const result = await this.callWebBridge({
      action: 'fetch_page',
      url,
    })

    if (!result.success) {
      throw new Error(result.error || 'WebBridge fetch failed')
    }

    return result.data?.[0]?.rawHtml || ''
  }

  async scrapeSource(source: SourceRecord): Promise<ScrapedOpportunity[]> {
    const result = await this.callWebBridge({
      action: 'scrape_source',
      url: source.url,
      sourceName: source.name,
      sourceType: source.type,
      instructions: `Navigate the page at ${source.url} and return a JSON array of opportunities. Each item should include title, url, description, deadline, country, category, organization, eligibility, and applicationLink. Follow pagination where available.`,
    })

    if (!result.success) {
      throw new Error(result.error || 'WebBridge scrape failed')
    }

    return result.data || []
  }

  private async callWebBridge(payload: Record<string, unknown>): Promise<{ success: boolean; data?: ScrapedOpportunity[]; error?: string }> {
    const response = await fetch(KIMI_WEBBRIDGE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${KIMI_WEBBRIDGE_API_KEY}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const text = await response.text()
      return { success: false, error: `WebBridge request failed (${response.status}): ${text}` }
    }

    return response.json()
  }
}

export class HttpScrapingProvider implements ScrapingProvider {
  providerName: ScrapingProviderName = 'http'

  async fetchPage(url: string): Promise<string> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)
    let response: Response
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        redirect: 'follow',
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeout)
    }

    if (!response.ok) {
      throw new Error(`HTTP fetch failed: ${response.status} ${response.statusText}`)
    }

    return response.text()
  }

  async scrapeSource(source: SourceRecord): Promise<ScrapedOpportunity[]> {
    const profile = getSourceProfile(source.url)
    const results = new Map<string, ScrapedOpportunity>()

    if (profile?.rssUrl) {
      await this.collectFeed(profile.rssUrl, source, results)
    }

    if (profile?.sitemapUrl) {
      await this.collectSitemap(profile.sitemapUrl, source, results)
    }

    if (profile?.listingUrl) {
      await this.collectListingPage(profile.listingUrl, source, profile, results)
    }

    if (!results.size) {
      await this.collectListingPage(source.url, source, profile, results)
    }

    if (!results.size && profile?.searchUrl && profile.searchUrl !== source.url) {
      await this.collectListingPage(profile.searchUrl, source, profile, results)
    }

    // Auto-discover sitemap.xml for any domain without a profile
    if (profile && !profile.sitemapUrl && !profile.rssUrl && results.size < 3) {
      const sitemapUrl = this.tryDiscoverSitemap(source.url)
      if (sitemapUrl) {
        await this.collectSitemap(sitemapUrl, source, results)
      }
    }

    if (!results.size) {
      try {
        const homeHtml = await this.fetchPage(source.url)
        await this.collectListingsFromHtml(homeHtml, source.url, source, profile, results)
      } catch {
        // ignore home page fallback failures
      }
    }

    return Array.from(results.values())
  }

  private tryDiscoverSitemap(sourceUrl: string): string | null {
    try {
      const url = new URL(sourceUrl)
      const candidates = [
        `${url.origin}/sitemap.xml`,
        `${url.origin}/sitemap_index.xml`,
        `${url.origin}/sitemap/sitemap.xml`,
      ]
      // Return first candidate — the caller will handle fetch failures gracefully
      return candidates[0]
    } catch {
      return null
    }
  }

  async scrapeFeed(url: string): Promise<ScrapedOpportunity[]> {
    const xml = await this.fetchPage(url)
    return this.parseFeed(xml, url)
  }

  private async collectFeed(url: string, source: SourceRecord, results: Map<string, ScrapedOpportunity>) {
    try {
      const feedItems = await this.scrapeFeed(url)
      for (const item of feedItems) {
        this.addResult(results, item)
      }
    } catch {
      // ignore feed failures and continue with other fallbacks
    }
  }

  private async collectSitemap(sitemapUrl: string, source: SourceRecord, results: Map<string, ScrapedOpportunity>) {
    try {
      const urls = await this.extractSitemapUrls(sitemapUrl, source)
      const candidates = urls.slice(0, 20)
      for (const url of candidates) {
        try {
          const pageHtml = await this.fetchPage(url)
          const extracted = await this.extractStructuredData(pageHtml, url)
          extracted.forEach((item) => this.addResult(results, item))
          await this.collectListingsFromHtml(pageHtml, url, source, undefined, results)
        } catch {
          continue
        }
      }
    } catch {
      // ignore sitemap failures
    }
  }

  private async collectListingPage(
    url: string,
    source: SourceRecord,
    profile: ReturnType<typeof getSourceProfile> | undefined,
    results: Map<string, ScrapedOpportunity>,
    depth = 0,
  ) {
    if (depth > 3) return

    try {
      const html = await this.fetchPage(url)
      const extracted = await this.extractStructuredData(html, url)
      extracted.forEach((item) => this.addResult(results, item))
      await this.collectListingsFromHtml(html, url, source, profile, results)

      if (profile?.paginationSelector) {
        const nextPage = await this.findNextPageUrl(html, url, profile.paginationSelector)
        if (nextPage) {
          await this.collectListingPage(nextPage, source, profile, results, depth + 1)
        }
      }
    } catch {
      // ignore page fetch failures
    }
  }

  private async collectListingsFromHtml(
    html: string,
    baseUrl: string,
    source: SourceRecord,
    profile: ReturnType<typeof getSourceProfile> | undefined,
    results: Map<string, ScrapedOpportunity>,
  ) {
    const items = await this.findOpportunitiesFromHtml(html, baseUrl, source, profile)
    items.forEach((item) => this.addResult(results, item))
  }

  private async findOpportunitiesFromHtml(
    html: string,
    baseUrl: string,
    source: SourceRecord,
    profile: ReturnType<typeof getSourceProfile> | undefined,
  ): Promise<ScrapedOpportunity[]> {
    const parser = await this.getDomParser()
    const doc = new parser().parseFromString(html, 'text/html') as Document
    const selectors = profile?.listingItemSelector
      ? [profile.listingItemSelector]
      : [
          'article',
          '.job',
          '.job-card',
          '.job-listing',
          '.career',
          '.listing',
          '.opportunity',
          '.grant',
          '.scholarship',
          '.result',
          '.post',
          '.entry',
        ]

    const containers = Array.from(doc.querySelectorAll(selectors.join(',')))
    const items: ScrapedOpportunity[] = []

    if (containers.length === 0) {
      const anchors = Array.from(doc.querySelectorAll('a[href]') as NodeListOf<HTMLAnchorElement>)
      for (const anchor of anchors.slice(0, 50)) {
        const url = this.normalizeUrl(anchor.getAttribute('href') || '', baseUrl)
        const text = anchor.textContent?.trim() || ''
        if (!url || !text) continue
        // apply profile-driven URL pattern filtering when available
        if (profile?.exclusionPatterns && profile.exclusionPatterns.some((p) => url.toLowerCase().includes(p))) continue
        if (profile?.opportunityUrlPatterns) {
          const matched = profile.opportunityUrlPatterns.some((p) => url.toLowerCase().includes(p) || text.toLowerCase().includes(p))
          if (!matched) continue
        }
        if (/(scholarship|grant|job|career|vacancy|opportunity|fellowship)/i.test(text)) {
          items.push({
            title: text,
            url,
            description: '',
            rawHtml: '',
          })
        }
      }
      return items
    }

    for (const container of containers.slice(0, 40)) {
      const title = this.extractText(container, profile?.itemTitleSelectors || ['h1', 'h2', 'h3', 'a', '.title', '.job-title', '.heading'])
      const url = this.findFirstLink(container, baseUrl)
      if (!title || !url) continue
      if (profile?.exclusionPatterns && profile.exclusionPatterns.some((p) => url.toLowerCase().includes(p))) continue
      if (profile?.opportunityUrlPatterns) {
        const matched = profile.opportunityUrlPatterns.some((p) => url.toLowerCase().includes(p) || title.toLowerCase().includes(p))
        if (!matched) continue
      }

      const description = this.extractText(container, profile?.itemDescriptionSelectors || ['p', '.description', '.summary', '.snippet'])
      const deadline = this.extractDeadline(container.textContent || '')
      const organization = this.extractText(container, ['.organization', '.org', '.source', '.provider'])
      const applicationLink = this.findApplicationLink(container, baseUrl)

      items.push({
        title,
        url,
        description,
        deadline,
        organization,
        applicationLink,
        rawHtml: '',
      })
    }

    return items
  }

  private addResult(results: Map<string, ScrapedOpportunity>, item: ScrapedOpportunity) {
    const key = this.normalizeUrl(item.url, item.url)
    if (!key) return
    const existing = results.get(key)
    if (!existing) {
      results.set(key, item)
      return
    }

    const merged: ScrapedOpportunity = {
      ...existing,
      ...item,
      description: item.description || existing.description,
      deadline: item.deadline || existing.deadline,
      country: item.country || existing.country,
      organization: item.organization || existing.organization,
      eligibility: item.eligibility || existing.eligibility,
      applicationLink: item.applicationLink || existing.applicationLink,
    }
    results.set(key, merged)
  }

  private normalizeUrl(url: string, baseUrl: string): string {
    try {
      return new URL(url, baseUrl).toString()
    } catch {
      return ''
    }
  }

  private async getDomParser() {
    if (typeof DOMParser !== 'undefined') {
      return DOMParser
    }

    const { DOMParser: LinkedomDOMParser } = await import('linkedom')
    return LinkedomDOMParser
  }

  private async parseDocument(html: string, mimeType: string): Promise<Document> {
    const Parser = await this.getDomParser()
    return new Parser().parseFromString(html, mimeType as any) as Document
  }

  private async extractSitemapUrls(sitemapUrl: string, source: SourceRecord): Promise<string[]> {
    const xml = await this.fetchPage(sitemapUrl)
    const doc = await this.parseDocument(xml, 'application/xml')
    const host = this.extractHost(source.url)
    const sitemapNodes = Array.from(doc.querySelectorAll('sitemap > loc') as NodeListOf<Element>).map((node) => node.textContent?.trim() || '')
    const urls: string[] = []

    if (sitemapNodes.length) {
      const nested = sitemapNodes.slice(0, 10)
      for (const sitemap of nested) {
        if (!sitemap) continue
        try {
          const nestedXml = await this.fetchPage(sitemap)
          const nestedDoc = await this.parseDocument(nestedXml, 'application/xml')
          urls.push(...Array.from(nestedDoc.querySelectorAll('url > loc') as NodeListOf<Element>).map((node) => node.textContent?.trim() || ''))
        } catch {
          // ignore nested sitemap failures
        }
      }
    } else {
      urls.push(...Array.from(doc.querySelectorAll('url > loc') as NodeListOf<Element>).map((node) => node.textContent?.trim() || ''))
    }

    return urls
      .map((link) => this.normalizeUrl(link, sitemapUrl))
      .filter((link) => link && link.includes(host) && this.sitemapUrlFilter(link, source))
      .slice(0, 50)
  }

  private sitemapUrlFilter(url: string, source: SourceRecord): boolean {
    const normalized = url.toLowerCase()
    const keywords = ['scholarship', 'fellowship', 'grant', 'opportunity', 'job', 'career', 'vacancy', 'internship', 'funding', 'award']
    return keywords.some((keyword) => normalized.includes(keyword)) || normalized.includes(this.extractHost(source.url))
  }

  private extractHost(url: string): string {
    try {
      return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
    } catch {
      return url.toLowerCase()
    }
  }

  private extractText(element: Element, selectors: string[]): string {
    for (const selector of selectors) {
      const node = element.querySelector(selector)
      const text = node?.textContent?.trim()
      if (text) return text
    }
    return element.textContent?.trim() || ''
  }

  private findFirstLink(element: Element, baseUrl: string): string {
    const anchor = element.querySelector('a[href]')
    if (!anchor) return ''
    return this.normalizeUrl(anchor.getAttribute('href') || '', baseUrl)
  }

  private findApplicationLink(element: Element, baseUrl: string): string {
    const candidate = Array.from(element.querySelectorAll('a[href]')).find((anchor) => {
      const text = anchor.textContent?.trim() || ''
      return /(apply|application|submit|register|details)/i.test(text)
    })
    if (candidate) {
      return this.normalizeUrl(candidate.getAttribute('href') || '', baseUrl)
    }
    return ''
  }

  private extractDeadline(text: string): string | undefined {
    const normalizedText = text.replace(/\s+/g, ' ')
    const deadlineMatch = normalizedText.match(/(?:deadline|due date|apply by|submission date)[:\s]*([^\.\n\r]+)/i)
    if (deadlineMatch?.[1]) {
      const candidate = deadlineMatch[1].trim()
      const parsed = new Date(candidate)
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0]
      }
      return candidate
    }
    return undefined
  }

  private async findNextPageUrl(html: string, baseUrl: string, selector: string): Promise<string> {
    const parser = await this.getDomParser()
    const doc = new parser().parseFromString(html, 'text/html')
    const anchor = doc.querySelector(selector)
    if (anchor instanceof HTMLAnchorElement && anchor.href) {
      return this.normalizeUrl(anchor.href, baseUrl)
    }
    if (anchor?.getAttribute('href')) {
      return this.normalizeUrl(anchor.getAttribute('href') || '', baseUrl)
    }
    return ''
  }

  private async extractStructuredData(html: string, baseUrl: string): Promise<ScrapedOpportunity[]> {
    const results: ScrapedOpportunity[] = []
    const jsonLdMatches = Array.from(html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))

    for (const match of jsonLdMatches) {
      try {
        const parsed = JSON.parse(match[1].trim())
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            const opportunity = this.parseJsonLdItem(item, baseUrl)
            if (opportunity) results.push(opportunity)
          }
        } else {
          const opportunity = this.parseJsonLdItem(parsed, baseUrl)
          if (opportunity) results.push(opportunity)
        }
      } catch {
        continue
      }
    }

    return results
  }

  private parseJsonLdItem(item: any, baseUrl: string): ScrapedOpportunity | null {
    if (!item || typeof item !== 'object') return null
    const type = String(item['@type'] || item['type'] || '').toLowerCase()
    if (!type.includes('jobposting') && !type.includes('scholarship') && !type.includes('grant') && !type.includes('event') && !type.includes('opportunity')) {
      return null
    }

    const url = this.normalizeUrl(String(item.url || item['@id'] || baseUrl || ''), baseUrl)
    const title = String(item.name || item.title || '')
    if (!title || !url) return null

    return {
      externalId: String(item.identifier || item['@id'] || item.guid || ''),
      title,
      description: String(item.description || item.description?.text || ''),
      url,
      deadline: String(item.validThrough || item.deadline || item.endDate || item.datePosted || '' ) || undefined,
      country: item.areaServed?.name || item.country || undefined,
      category: undefined,
      organization: item.hiringOrganization?.name || item.provider?.name || undefined,
      eligibility: String(item.qualifications || item.educationalRequirements || ''),
      applicationLink: this.normalizeUrl(String(item.applicationContact || item.applicationUrl || item.url || ''), baseUrl),
      rawHtml: '',
    }
  }

  private async parseFeed(xml: string, baseUrl: string): Promise<ScrapedOpportunity[]> {
    const doc = await this.parseDocument(xml, 'application/xml')
    const entries = Array.from(doc.querySelectorAll('item, entry'))
    const results: ScrapedOpportunity[] = []

    for (const entry of entries.slice(0, 40)) {
      const title = entry.querySelector('title')?.textContent?.trim() || ''
      const linkNode = entry.querySelector('link')
      let url = ''

      if (linkNode?.getAttribute('href')) {
        url = linkNode.getAttribute('href') || ''
      } else {
        url = linkNode?.textContent?.trim() || ''
      }

      if (!url) {
        url = entry.querySelector('guid')?.textContent?.trim() || ''
      }

      url = this.normalizeUrl(url, baseUrl)
      if (!title || !url) continue

      const description = entry.querySelector('description')?.textContent?.trim() || entry.querySelector('summary')?.textContent?.trim() || ''
      const pubDate = entry.querySelector('pubDate')?.textContent?.trim() || entry.querySelector('published')?.textContent?.trim() || ''
      const deadline = pubDate ? new Date(pubDate).toISOString().split('T')[0] : undefined

      results.push({
        title,
        url,
        description,
        deadline,
        rawHtml: '',
      })
    }

    return results
  }
}

export class StubScrapingProvider implements ScrapingProvider {
  providerName: ScrapingProviderName = 'stub'

  async fetchPage(_url: string): Promise<string> {
    return ''
  }

  async scrapeSource(_source: SourceRecord): Promise<ScrapedOpportunity[]> {
    return []
  }
}

export function getScrapingProvider(): ScrapingProvider {
  if (hasWebBridgeConfig()) {
    return new WebBridgeScrapingProvider()
  }
  return new HttpScrapingProvider()
}

