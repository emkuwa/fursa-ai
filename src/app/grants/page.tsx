import type { Metadata } from 'next'
import { CategoryClient } from '@/components/opportunities/category-client'
import { APP_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Grants',
  description: 'Funding opportunities for projects, research, and initiatives. Discover grants for NGOs, startups, researchers, and community organizations.',
  openGraph: {
    title: 'Grants | Fursa AI',
    description: 'Funding opportunities for projects, research, and initiatives.',
  },
  alternates: { canonical: `${APP_URL}/grants` },
}

export default function GrantsPage() {
  return <CategoryClient category="grant" title="Grants" description="Funding for projects, research, and initiatives" />
}
