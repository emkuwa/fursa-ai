import type { Metadata } from 'next'
import CountryClient from './client'
import { createServiceClient } from '@/lib/supabase/client'

type Props = { params: Promise<{ country: string }> }

export async function generateStaticParams() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('opportunities')
    .select('country')
    .not('country', 'is', null)
    .in('status', ['approved', 'featured'])

  const countries = [...new Set((data || []).map(r => (r as { country: string }).country).filter(Boolean))]
  return countries.map(country => ({ country: encodeURIComponent(country) }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params
  const decoded = decodeURIComponent(country)
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://fursaai.com'
  return {
    title: `Opportunities in ${decoded}`,
    description: `Discover scholarships, jobs, grants, and fellowships in ${decoded}. Find verified opportunities for African students and professionals in ${decoded}.`,
    alternates: { canonical: `${APP_URL}/countries/${country}` },
    openGraph: {
      title: `Opportunities in ${decoded} | Fursa AI`,
      description: `Browse ${decoded} opportunities — scholarships, jobs, grants, and fellowships curated for Africans.`,
    },
  }
}

export default function CountryPage({ params }: Props) {
  return <CountryClient params={params} />
}
