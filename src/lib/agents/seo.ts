import { BaseAgent, type AgentResult } from './base-agent'
import { CATEGORIES, COUNTRIES } from '@/lib/constants'
import { generateSlug } from '@/lib/utils'

const TARGET_CATEGORIES = ['scholarship', 'foreign_job', 'grant', 'tender', 'fellowship', 'startup_funding', 'competition']
const ALL_COUNTRIES = [...COUNTRIES]
const AFRICAN_COUNTRIES = COUNTRIES.slice(0, 15)

const CATEGORY_LABELS: Record<string, string> = {
  scholarship: 'Scholarships', foreign_job: 'Foreign Jobs', grant: 'Grants',
  tender: 'Tenders', fellowship: 'Fellowships', competition: 'Competitions',
  startup_funding: 'Startup Funding', internship: 'Internships', exchange_program: 'Exchange Programs',
}

const CATEGORY_PLURALS: Record<string, string> = {
  scholarship: 'scholarships', foreign_job: 'foreign-jobs', grant: 'grants',
  tender: 'tenders', fellowship: 'fellowships', competition: 'competitions',
  startup_funding: 'startup-funding', internship: 'internships', exchange_program: 'exchange-programs',
}

function generateMetaTitle(category: string, country?: string, extra?: string): string {
  const label = CATEGORY_LABELS[category] || category
  if (country && extra) return `${label} in ${country} for ${extra} 2026 | Fursa AI`
  if (country) return `${label} in ${country} 2026 | Fursa AI - Apply Today`
  return `Top ${label} for African Students 2026 | Fursa AI`
}

function generateMetaDescription(category: string, country?: string, extra?: string): string {
  const label = CATEGORY_LABELS[category] || category
  if (country && extra) return `Find ${label.toLowerCase()} in ${country} for ${extra}. Browse fully funded international ${label.toLowerCase()} for African students. Apply online.`
  if (country) return `Discover ${label.toLowerCase()} in ${country} for African students and professionals. Browse fully funded international opportunities. Apply today.`
  return `Find the best ${label.toLowerCase()} for African students and professionals. Fully funded international opportunities. Apply online today.`
}

function generateContent(category: string, country?: string, extra?: string): string {
  const label = CATEGORY_LABELS[category] || category
  const plural = CATEGORY_PLURALS[category] || `${category.toLowerCase()}s`
  const location = country ? ` in ${country}` : ''
  const audience = extra ? ` for ${extra}` : ' for African Students and Professionals'

  return `<h2>Top ${label}${location}${audience}</h2>
<p>Fursa AI brings you the most comprehensive list of ${label.toLowerCase()}${location}${audience}. Our platform curates opportunities from verified sources to help you find the perfect match for your career or education goals.</p>

<h3>Why Choose ${label}${location}?</h3>
<p>${label}${location} offer incredible opportunities for African students and professionals to advance their careers, gain international experience, and build valuable skills. Whether you are looking for fully funded scholarships, competitive job placements, or research grants, ${plural}${location} provide pathways to success.</p>

<h3>Types of ${label} Available${location}</h3>
<ul>
<li>Fully funded ${plural}${location} with living stipends</li>
<li>Partially funded opportunities</li>
<li>Research and academic ${plural}</li>
<li>Professional development programs</li>
<li>Short-term and long-term opportunities</li>
</ul>

<h3>How to Apply for ${label}${location}</h3>
<ol>
<li>Browse the latest ${plural} on Fursa AI</li>
<li>Check eligibility requirements carefully</li>
<li>Prepare your application documents</li>
<li>Submit before the deadline</li>
<li>Track your application status</li>
</ol>

<h3>Tips for a Successful Application</h3>
<ul>
<li>Start early and research thoroughly</li>
<li>Tailor your application to each opportunity</li>
<li>Highlight your unique strengths and experiences</li>
<li>Get feedback on your essays and statements</li>
<li>Follow up professionally</li>
</ul>

<h3>Frequently Asked Questions</h3>
<h4>Who can apply for ${label.toLowerCase()}${location}?</h4>
<p>Eligibility varies by opportunity. Most ${plural} require a minimum educational qualification and relevant experience. Check each opportunity for specific requirements.</p>

<h4>When are the application deadlines?</h4>
<p>Deadlines vary throughout the year. Use Fursa AI to filter by upcoming deadlines and never miss an opportunity.</p>

<h4>Do I need to pay to apply?</h4>
<p>Most legitimate opportunities do not require application fees. Be cautious of any opportunity asking for payment.</p>

<h4>Can I apply for multiple ${plural}?</h4>
<p>Yes, we encourage applying for multiple opportunities to increase your chances of success.</p>`
}

function generatePageSpec(category: string, country?: string, extra?: string) {
  const catLabel = CATEGORY_LABELS[category] || category
  let slug: string
  let title: string
  let h1: string
  let tags: string[]

  if (country && extra) {
    slug = generateSlug(`${catLabel}-in-${country}-for-${extra}`)
    title = `${catLabel} in ${country} for ${extra} 2026 | Fursa AI`
    h1 = `${catLabel} in ${country} for ${extra}`
    tags = [catLabel, country, extra, 'opportunities']
  } else if (country) {
    slug = generateSlug(`${CATEGORY_PLURALS[category]}-in-${country}`)
    title = `${catLabel} in ${country} 2026 | Fursa AI`
    h1 = `Top ${catLabel} in ${country}`
    tags = [catLabel, country, 'opportunities', 'international']
  } else if (extra) {
    slug = generateSlug(`${CATEGORY_PLURALS[category]}-for-${extra}`)
    title = `${catLabel} for ${extra} 2026 | Fursa AI`
    h1 = `${catLabel} for ${extra}`
    tags = [catLabel, extra, 'opportunities']
  } else {
    slug = `${CATEGORY_PLURALS[category]}`
    title = `${catLabel} for Africans 2026 | Fursa AI`
    h1 = `Top ${catLabel} for African Students and Professionals`
    tags = [catLabel, 'opportunities', 'africa', 'international']
  }

  return {
    slug,
    title,
    meta_description: generateMetaDescription(category, country, extra),
    h1,
    content: generateContent(category, country, extra),
    category,
    country,
    tags,
    word_count: 500,
  }
}

export class SEOAgent extends BaseAgent {
  constructor() {
    super('seo', 2)
  }

  async execute(action: string, payload?: Record<string, unknown>): Promise<AgentResult> {
    switch (action) {
      case 'generate-all':
        return this.generateAllPages()
      case 'generate-category':
        return this.generateCategoryPages()
      case 'generate-country':
        return this.generateCountryPages()
      case 'generate-combo':
        return this.generateCombinationPages()
      case 'generate-one':
        return this.generatePage(payload)
      default:
        return { success: false, message: `Unknown action: ${action}` }
    }
  }

  async generateAllPages(): Promise<AgentResult> {
    const catCount = (await this.generateCategoryPages()).data as any
    const countryCount = (await this.generateCountryPages()).data as any
    const comboCount = (await this.generateCombinationPages()).data as any
    const total = (catCount?.generated || 0) + (countryCount?.generated || 0) + (comboCount?.generated || 0)
    return { success: true, message: `Generated ${total} total pages`, data: { total, categories: catCount?.generated, countries: countryCount?.generated, combos: comboCount?.generated } as any }
  }

  async generateCategoryPages(): Promise<AgentResult> {
    let generated = 0
    for (const cat of TARGET_CATEGORIES) {
      const spec = generatePageSpec(cat)
      if (await this.insertIfMissing(spec)) generated++
    }
    return { success: true, message: `Generated ${generated} category pages`, data: { generated } as any }
  }

  async generateCountryPages(): Promise<AgentResult> {
    let generated = 0
    for (const country of ALL_COUNTRIES) {
      const spec = generatePageSpec('scholarship', country)
      if (await this.insertIfMissing(spec)) generated++
    }
    return { success: true, message: `Generated ${generated} country pages`, data: { generated } as any }
  }

  async generateCombinationPages(): Promise<AgentResult> {
    let generated = 0

    // All categories x all African countries
    for (const country of AFRICAN_COUNTRIES) {
      for (const cat of TARGET_CATEGORIES) {
        const spec = generatePageSpec(cat, country)
        if (await this.insertIfMissing(spec)) generated++
      }
    }

    // Top categories x popular non-African countries
    const topNonAfrican = ['USA', 'UK', 'Canada', 'Germany', 'Australia', 'Netherlands', 'Sweden', 'Norway', 'China', 'Japan']
    const popularCategories = ['scholarship', 'foreign_job', 'grant']
    for (const country of topNonAfrican) {
      for (const cat of popularCategories) {
        const spec = generatePageSpec(cat, country)
        if (await this.insertIfMissing(spec)) generated++
      }
    }

    // Additional specific niches
    const niches: { cat: string; country?: string; extra: string }[] = [
      { cat: 'grant', extra: 'NGOs' },
      { cat: 'grant', extra: 'Women' },
      { cat: 'grant', extra: 'Youth' },
      { cat: 'grant', extra: 'Researchers' },
      { cat: 'grant', country: 'Africa', extra: 'NGOs' },
      { cat: 'scholarship', extra: 'Undergraduate' },
      { cat: 'scholarship', extra: 'Masters' },
      { cat: 'scholarship', extra: 'PhD' },
      { cat: 'scholarship', extra: 'Women' },
      { cat: 'fellowship', extra: 'Early Career' },
      { cat: 'fellowship', extra: 'Postdoctoral' },
      { cat: 'startup_funding', extra: 'Early Stage' },
      { cat: 'startup_funding', extra: 'African Startups' },
      { cat: 'competition', extra: 'Students' },
      { cat: 'competition', extra: 'Youth' },
    ]

    for (const niche of niches) {
      const spec = generatePageSpec(niche.cat, niche.country, niche.extra)
      if (await this.insertIfMissing(spec)) generated++
    }

    return { success: true, message: `Generated ${generated} combination pages`, data: { generated } as any }
  }

  async generatePage(payload?: Record<string, unknown>): Promise<AgentResult> {
    const slug = payload?.slug as string
    const category = payload?.category as string
    const country = payload?.country as string
    const extra = payload?.extra as string

    if (!slug && !category) return { success: false, message: 'No slug or category provided' }
    if (category) {
      const spec = generatePageSpec(category, country, extra)
      if (await this.insertIfMissing(spec)) {
        return { success: true, message: `Generated page: ${spec.slug}` }
      }
      return { success: true, message: 'Page already exists' }
    }

    const spec = generatePageSpec('scholarship')
    spec.slug = slug
    if (await this.insertIfMissing(spec)) {
      return { success: true, message: `Generated page: ${slug}` }
    }
    return { success: true, message: 'Page already exists' }
  }

  private async insertIfMissing(spec: any): Promise<boolean> {
    const { data: existing } = await this.supabase
      .from('seo_content')
      .select('id')
      .eq('slug', spec.slug)
      .maybeSingle()

    if (existing) return false

    const { error } = await this.supabase.from('seo_content').insert({
      ...spec,
      is_indexed: true,
      canonical_url: `https://fursaai.com/${spec.slug}`,
    })

    return !error
  }
}
