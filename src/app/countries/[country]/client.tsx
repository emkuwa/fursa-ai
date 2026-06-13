'use client'

import { useEffect, useState } from 'react'
import { useOpportunities } from '@/lib/hooks/use-opportunities'
import { OpportunityCard } from '@/components/opportunities/opportunity-card'
import { SearchBar } from '@/components/ui/search-bar'
import { useAnalytics } from '@/lib/hooks/use-analytics'

export default function CountryClient({ params }: { params: Promise<{ country: string }> }) {
  const [country, setCountry] = useState('')
  const { track } = useAnalytics()

  useEffect(() => {
    params.then(p => {
      const decoded = decodeURIComponent(p.country)
      setCountry(decoded)
      track({ event_type: 'view', country: decoded, metadata: { page: 'country' } })
    })
  }, [params, track])

  const { opportunities, loading } = useOpportunities({ country, limit: 50 })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Opportunities in {country}</h1>
        <p className="text-gray-600">
          {loading ? 'Loading...' : `${opportunities.length} opportunities found in ${country}`}
        </p>
      </div>
      <div className="mb-6"><SearchBar /></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))
        ) : opportunities.length === 0 ? (
          <div className="col-span-full text-center py-20 text-gray-500">
            <p className="text-lg">No opportunities found for {country} yet.</p>
            <p className="text-sm mt-2">Check back soon as we add new opportunities daily.</p>
          </div>
        ) : (
          opportunities.map(opp => <OpportunityCard key={opp.id} opportunity={opp} />)
        )}
      </div>
    </div>
  )
}
