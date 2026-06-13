import type { Metadata } from 'next'
import { CategoryClient } from '@/components/opportunities/category-client'
import { APP_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Fellowships',
  description: 'Professional development and research fellowships for African students and professionals. Discover fully-funded opportunities worldwide.',
  openGraph: {
    title: 'Fellowships | Fursa AI',
    description: 'Professional development and research fellowships for African students and professionals.',
  },
  alternates: { canonical: `${APP_URL}/fellowships` },
}

export default function FellowshipsPage() {
  return <CategoryClient category="fellowship" title="Fellowships" description="Professional development and research programs" />
}
