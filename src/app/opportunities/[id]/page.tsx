import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/client'
import { APP_URL } from '@/lib/constants'
import OpportunityDetailClient from './client'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('opportunities')
    .select('title, summary, category, country')
    .eq('id', id)
    .single()

  if (!data) {
    return { title: 'Opportunity Not Found' }
  }

  const title = data.title
  const description = data.summary
    ? data.summary.slice(0, 160)
    : `Apply for ${title} — a ${data.category} opportunity${data.country ? ` in ${data.country}` : ''}.`

  return {
    title,
    description,
    openGraph: {
      title: `${title} | Fursa AI`,
      description,
      url: `${APP_URL}/opportunities/${id}`,
    },
    twitter: {
      title: `${title} | Fursa AI`,
      description,
    },
    alternates: {
      canonical: `${APP_URL}/opportunities/${id}`,
    },
  }
}

export default function OpportunityDetailPage() {
  return <OpportunityDetailClient />
}
