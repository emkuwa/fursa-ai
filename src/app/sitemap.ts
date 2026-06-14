import type { MetadataRoute } from 'next'
import { createServiceClient } from '@/lib/supabase/client'
import { APP_URL } from '@/lib/constants'

const BUILT_CATEGORIES = [
  { slug: 'scholarships', label: 'Scholarships' },
  { slug: 'jobs', label: 'Foreign Jobs' },
  { slug: 'grants', label: 'Grants' },
  { slug: 'fellowships', label: 'Fellowships' },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServiceClient()

  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('id, updated_at')
    .in('status', ['approved', 'featured'])
    .order('updated_at', { ascending: false })
    .limit(1000)

  const { data: countriesData } = await supabase
    .from('opportunities')
    .select('country')
    .not('country', 'is', null)
    .in('status', ['approved', 'featured'])

  const countries = [...new Set((countriesData || []).map(r => (r as { country: string }).country).filter(Boolean))]

  const staticPages = [
    { url: `${APP_URL}/`, priority: 1.0 as const, changeFrequency: 'hourly' as const },
    { url: `${APP_URL}/opportunities`, priority: 0.9 as const, changeFrequency: 'hourly' as const },
    ...BUILT_CATEGORIES.map(c => ({
      url: `${APP_URL}/${c.slug}`,
      priority: 0.8 as const,
      changeFrequency: 'daily' as const,
    })),
    { url: `${APP_URL}/pricing`, priority: 0.5 as const, changeFrequency: 'monthly' as const },
    { url: `${APP_URL}/about`, priority: 0.7 as const, changeFrequency: 'monthly' as const },
    { url: `${APP_URL}/contact`, priority: 0.6 as const, changeFrequency: 'monthly' as const },
    { url: `${APP_URL}/privacy`, priority: 0.3 as const, changeFrequency: 'yearly' as const },
    { url: `${APP_URL}/terms`, priority: 0.3 as const, changeFrequency: 'yearly' as const },
    { url: `${APP_URL}/beta`, priority: 0.4 as const, changeFrequency: 'weekly' as const },
  ]

  const opportunityPages = (opportunities || []).map(opp => ({
    url: `${APP_URL}/opportunities/${opp.id}`,
    priority: 0.7 as const,
    changeFrequency: 'weekly' as const,
    lastModified: opp.updated_at,
  }))

  const countryPages = countries.map(country => ({
    url: `${APP_URL}/countries/${encodeURIComponent(country)}`,
    priority: 0.7 as const,
    changeFrequency: 'daily' as const,
  }))

  return [
    ...staticPages,
    ...opportunityPages,
    ...countryPages,
  ]
}
