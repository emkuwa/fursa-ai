'use client'

import { Suspense, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useOpportunities } from '@/lib/hooks/use-opportunities'
import { OpportunityCard } from '@/components/opportunities/opportunity-card'
import { SearchBar } from '@/components/ui/search-bar'
import { Button } from '@/components/ui/button'
import type { OpportunityCategory } from '@/types'
import { CATEGORIES } from '@/lib/constants'
import { Filter, SlidersHorizontal, Grid, List } from 'lucide-react'

function OpportunitiesContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const [filters, setFilters] = useState({
    query: initialQuery,
    category: '' as OpportunityCategory | '',
    sort_by: 'created_at' as 'created_at' | 'quality_score' | 'deadline',
    sort_order: 'desc' as 'asc' | 'desc',
  })

  const { opportunities, loading, total } = useOpportunities({
    query: filters.query || undefined,
    category: filters.category || undefined,
    sort_by: filters.sort_by,
    sort_order: filters.sort_order,
    limit: 30,
  })

  const handleSearch = useCallback((q: string) => {
    setFilters(prev => ({ ...prev, query: q }))
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Opportunities</h1>
        <p className="text-gray-600">Discover opportunities matching your goals</p>
      </div>

      <div className="mb-6">
        <SearchBar />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <span className="text-sm text-gray-500">Category:</span>
        <button
          onClick={() => setFilters(prev => ({ ...prev, category: '' }))}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${!filters.category ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          All
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => setFilters(prev => ({ ...prev, category: cat.value }))}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filters.category === cat.value ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">{total} opportunities found</p>
        <div className="flex items-center gap-2">
          <select
            value={filters.sort_by}
            onChange={e => setFilters(prev => ({ ...prev, sort_by: e.target.value as any }))}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5"
          >
            <option value="created_at">Newest</option>
            <option value="quality_score">Highest Quality</option>
            <option value="deadline">Deadline</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-full mb-2" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : opportunities.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg mb-2">No opportunities found</p>
          <p className="text-gray-400">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map(opp => (
            <OpportunityCard key={opp.id} opportunity={opp} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function OpportunitiesClient() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="grid grid-cols-3 gap-6 mt-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    }>
      <OpportunitiesContent />
    </Suspense>
  )
}
