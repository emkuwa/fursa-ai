'use client'

import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { APP_NAME } from '@/lib/constants'

export default function BetaClient() {
  const [form, setForm] = useState({ full_name: '', email: '', country: '', interest_category: '' })
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setStatus({ type: 'idle', message: '' })

    const response = await fetch('/api/beta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: form.full_name,
        email: form.email,
        country: form.country,
        interest_category: form.interest_category,
        source_page: '/beta',
      }),
    })

    const result = await response.json()
    setLoading(false)

    if (result.success) {
      setStatus({ type: 'success', message: 'Thank you! You are on the waitlist.' })
      setForm({ full_name: '', email: '', country: '', interest_category: '' })
    } else {
      setStatus({ type: 'error', message: result.message || 'Something went wrong. Please try again.' })
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 py-16 px-4">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-10 shadow-2xl">
        <div className="mb-10 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-amber-600">Beta Launch</p>
          <h1 className="mt-3 text-4xl font-bold text-slate-900">Join the {APP_NAME} waitlist</h1>
          <p className="mt-4 text-gray-600">Get early access to the next phase of curated scholarships, jobs, grants and WhatsApp search delivery.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-700">
              Full name
              <Input value={form.full_name} onChange={e => setForm(prev => ({ ...prev, full_name: e.target.value }))} placeholder="Jane Doe" required />
            </label>
            <label className="space-y-2 text-sm text-slate-700">
              Email
              <Input type="email" value={form.email} onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))} placeholder="jane@example.com" required />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-700">
              Country
              <Input value={form.country} onChange={e => setForm(prev => ({ ...prev, country: e.target.value }))} placeholder="Nigeria" required />
            </label>
            <label className="space-y-2 text-sm text-slate-700">
              Interest category
              <Input value={form.interest_category} onChange={e => setForm(prev => ({ ...prev, interest_category: e.target.value }))} placeholder="Scholarships, Jobs, Grants" required />
            </label>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">We respect your privacy. No spam, only launch updates.</p>
            <Button type="submit" loading={loading}>{loading ? 'Joining...' : 'Join Waitlist'}</Button>
          </div>

          {status.type !== 'idle' && (
            <div className={`rounded-xl p-4 text-sm ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {status.message}
            </div>
          )}
        </form>
      </div>
    </main>
  )
}
