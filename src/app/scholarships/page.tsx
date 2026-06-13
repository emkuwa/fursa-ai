import type { Metadata } from 'next'
import { CategoryClient } from '@/components/opportunities/category-client'
import { APP_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Scholarships',
  description: 'Study abroad scholarships with full or partial funding for African students. Browse fully-funded opportunities to study in the UK, US, Canada, Europe, and beyond.',
  openGraph: {
    title: 'Scholarships | Fursa AI',
    description: 'Study abroad scholarships with full or partial funding for African students.',
  },
  alternates: { canonical: `${APP_URL}/scholarships` },
}

export default function ScholarshipsPage() {
  return <CategoryClient category="scholarship" title="Scholarships" description="Study abroad opportunities with full or partial funding" />
}
