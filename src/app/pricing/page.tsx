import type { Metadata } from 'next'
import { APP_URL } from '@/lib/constants'
import PricingClient from './client'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for Fursa AI. Choose a plan that fits your needs — from Free to Premium.',
  alternates: { canonical: `${APP_URL}/pricing` },
}

export default function PricingPage() {
  return <PricingClient />
}
