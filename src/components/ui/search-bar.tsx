'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowRight } from 'lucide-react'
import { useAnalytics } from '@/lib/hooks/use-analytics'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const router = useRouter()
  const { track } = useAnalytics()

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      track({ event_type: 'search', metadata: { query: query.trim() } })
      router.push(`/opportunities?q=${encodeURIComponent(query.trim())}`)
    }
  }, [query, router, track])

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div className="relative flex items-center">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search jobs, scholarships, internships or grants..."
          className="w-full pl-12 pr-32 py-4 rounded-2xl border-2 border-gray-200 bg-white shadow-lg text-lg focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-100 transition-all"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-amber-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-amber-600 transition-colors flex items-center gap-2"
        >
          Search
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  )
}
