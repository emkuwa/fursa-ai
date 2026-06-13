import { getScrapingProvider } from '../src/lib/scraping/provider'
import { SOURCE_PROFILES, type SourceProfile } from '../src/lib/scraping/source-profiles'

const provider = getScrapingProvider()

type Source = { id: string; name: string; type: string; url: string }

const sourcesFromProfiles: Source[] = Object.entries(SOURCE_PROFILES)
  .map(([id, profile]) => toSource(id, profile))
  .filter((s): s is Source => s !== null)
  .filter((s) => Boolean(s.url))


function toSource(id: string, profile: SourceProfile): Source | null {
  // Single source of truth: we only use `listingUrl`/`homepageUrl` from profiles.
  const url = profile.listingUrl || profile.homepageUrl
  if (!url) return null

  // Validation scripts are currently type-agnostic; preserve existing output fields.
  // Derive a best-effort category from URL/profile patterns.
  const lower = url.toLowerCase()
  let type = 'opportunity'
  if (lower.includes('grant') || id.includes('grants') || lower.includes('usaid') || lower.includes('afdb')) type = 'grant'
  else if (lower.includes('scholarship') || id.includes('scholar') || lower.includes('chevening') || lower.includes('daad') || lower.includes('fulbright')) type = 'scholarship'
  else if (lower.includes('job') || lower.includes('careers') || lower.includes('jobs') || id === 'linkedin.com' || id === 'indeed.com') type = 'job'

  return {
    id,
    name: id,
    type,
    url,
  }
}

const SOURCES: Source[] = sourcesFromProfiles


async function getDocument(html: string) {
  const { DOMParser } = await import('linkedom')
  return new DOMParser().parseFromString(html, 'text/html')
}

function scoreLink(text: string, href: string) {
  const combined = (text + ' ' + href).toLowerCase()
  const keywords = ['scholarship', 'grant', 'job', 'internship', 'fellowship', 'apply', 'deadline', 'award', 'opportunity', 'vacancy']
  let score = 0
  for (const k of keywords) if (combined.includes(k)) score += 2
  if (/\b(apply|deadline|due date|open until)\b/.test(combined)) score += 1
  return score
}

async function extractLinks(html: string, base: string) {
  const doc = await getDocument(html)
  const anchors = Array.from(doc.querySelectorAll('a[href]')) as HTMLAnchorElement[]
  const seen = new Set<string>()
  const results: { href: string; text: string; score: number }[] = []
  for (const a of anchors.slice(0, 300)) {
    const href = a.getAttribute('href')
    const text = (a.textContent || '').trim()

    if (!href) continue
    try {
      const url = new URL(href, base).toString()
      if (seen.has(url)) continue
      seen.add(url)
      const score = scoreLink(text, url)
      results.push({ href: url, text, score })
    } catch {
      continue
    }
  }
  results.sort((a, b) => b.score - a.score)
  return results
}

async function parseOpportunityPage(html: string, url: string) {
  const doc = await getDocument(html)
  // Try JSON-LD
  const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]')) as HTMLScriptElement[]
  for (const s of scripts) {
    try {
      const parsed = JSON.parse(s.textContent || '')

      const item = Array.isArray(parsed) ? parsed[0] : parsed
      if (item && (item.name || item.title)) {
        return {
          title: item.name || item.title || '',
          organization: item.provider?.name || item.hiringOrganization?.name || item.organizer?.name || '',
          deadline: item.validThrough || item.endDate || item.datePosted || '',
          country: item.areaServed?.name || item.country || '',
          category: item['@type'] || '',
          url,
        }
      }
    } catch {
      continue
    }
  }

  // Fallback generic extraction
  const title = (doc.querySelector('h1')?.textContent || doc.querySelector('title')?.textContent || '').trim()
  const metas = Array.from(doc.querySelectorAll('meta')) as HTMLMetaElement[]
  const org =
    (metas
      .find((m) => (m.getAttribute('name') || '').toLowerCase() === 'author')
      ?.getAttribute('content') || '')
  const country = ''

  return { title, organization: org, deadline: '', country, category: '', url }
}

async function validate() {
  const report: any[] = []
  let totalOpportunities = 0

  for (const src of SOURCES) {
    console.log('Testing', src.name, src.url)
    const entry: any = { source: src.name, listingUrl: src.url, linksDiscovered: 0, candidateLinks: [], opportunitiesParsed: [] }
    try {
      const html = await provider.fetchPage(src.url)
      const links = await extractLinks(html, src.url)
      entry.linksDiscovered = links.length
      const candidates = links.filter((l) => l.score > 0).slice(0, 25)
      entry.candidateLinks = candidates.map((c) => ({ href: c.href, text: c.text, score: c.score }))

      for (const c of candidates.slice(0, 12)) {
        try {
          const pageHtml = await provider.fetchPage(c.href)
          const parsed = await parseOpportunityPage(pageHtml, c.href)
          if (parsed.title) {
            entry.opportunitiesParsed.push(parsed)
            totalOpportunities++
          }
        } catch (e) {
          // ignore individual page failures
        }
      }
    } catch (e) {
      entry.error = String(e)
    }
    report.push(entry)
  }

  // Print succinct report
  console.log('\n=== Collector Validation Report ===')
  let parsedCount = 0
  for (const r of report) {
    console.log('Source:', r.source)
    console.log(' Listing:', r.listingUrl)
    console.log(' Links discovered:', r.linksDiscovered)
    console.log(' Candidate links:', r.candidateLinks.length)
    console.log(' Opportunities parsed:', r.opportunitiesParsed.length)
    parsedCount += r.opportunitiesParsed.length
    console.log('---')
  }
  console.log('Total opportunities parsed:', parsedCount)
  console.log('Done')
}

validate().catch((e) => { console.error(e); process.exit(1) })
