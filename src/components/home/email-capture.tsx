'use client'

import { useState, type FormEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Mail, CheckCircle2 } from 'lucide-react'

export function EmailCapture({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    try {
      const res = await fetch('/api/beta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source_page: '/home-hero' }),
      })
      const data = await res.json()
      if (data.success) {
        setStatus('success')
        setEmail('')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-center justify-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-xl px-4 py-3">
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
        You're on the list! We'll notify you when new opportunities match.
      </div>
    )
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
          />
        </div>
        <Button type="submit" size="sm" loading={status === 'loading'}>
          Join Waitlist
        </Button>
      </form>
    )
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
        <Mail className="w-4 h-4 text-amber-500" />
        Get notified when new opportunities match your profile
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="flex-1 px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
        />
        <Button type="submit" loading={status === 'loading'}>
          {status === 'loading' ? 'Joining...' : 'Join Waitlist'}
        </Button>
      </form>
      {status === 'error' && (
        <p className="text-xs text-red-500 mt-2">Something went wrong. Try again or email us directly.</p>
      )}
      <p className="text-xs text-gray-400 mt-2">No spam. Only launch updates and matched opportunities.</p>
    </div>
  )
}
