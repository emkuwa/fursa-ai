import type { Metadata } from 'next'
import { CategoryClient } from '@/components/opportunities/category-client'
import { APP_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Foreign Jobs',
  description: 'International employment opportunities for African professionals. Find jobs abroad in engineering, healthcare, tech, finance, and more.',
  openGraph: {
    title: 'Foreign Jobs | Fursa AI',
    description: 'International employment opportunities for African professionals.',
  },
  alternates: { canonical: `${APP_URL}/jobs` },
}

export default function JobsPage() {
  return <CategoryClient category="foreign_job" title="Foreign Jobs" description="International employment opportunities" />
}
