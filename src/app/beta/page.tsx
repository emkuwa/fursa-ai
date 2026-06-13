import type { Metadata } from 'next'
import { APP_URL } from '@/lib/constants'
import BetaClient from './client'

export const metadata: Metadata = {
  title: 'Join the Fursa AI Waitlist',
  description: 'Get early access to Fursa AI — the AI-powered opportunity discovery platform for African students and professionals.',
  alternates: { canonical: `${APP_URL}/beta` },
}

export default function BetaPage() {
  return <BetaClient />
}
