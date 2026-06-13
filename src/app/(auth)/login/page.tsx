import type { Metadata } from 'next'
import { APP_URL } from '@/lib/constants'
import LoginClient from './client'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Fursa AI account to manage your opportunities, saved items, and preferences.',
  alternates: { canonical: `${APP_URL}/login` },
}

export default function LoginPage() {
  return <LoginClient />
}
