import type { Metadata } from 'next'
import { APP_URL } from '@/lib/constants'
import RegisterClient from './client'

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create your Fursa AI account to discover scholarships, jobs, grants, and fellowships tailored for African students and professionals.',
  alternates: { canonical: `${APP_URL}/register` },
}

export default function RegisterPage() {
  return <RegisterClient />
}
