import type { Metadata } from 'next'
import { APP_URL } from '@/lib/constants'
import OpportunitiesClient from './client'

export const metadata: Metadata = {
  title: 'Opportunities',
  description: 'Browse all scholarships, jobs, grants, and fellowships in one place. Discover verified opportunities for African students and professionals.',
  alternates: { canonical: `${APP_URL}/opportunities` },
}

export default function OpportunitiesPage() {
  return <OpportunitiesClient />
}
