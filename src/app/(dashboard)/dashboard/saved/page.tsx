'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/use-user'
import { OpportunityCard } from '@/components/opportunities/opportunity-card'
import { Card, CardContent } from '@/components/ui/card'
import { Heart } from 'lucide-react'
import type { Opportunity } from '@/types'

export default function SavedPage() {
  const { user } = useUser()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }

    const supabase = createClient()
    supabase
      .from('user_matches')
      .select('opportunity_id, match_score')
      .eq('user_id', user.id)
      .eq('is_saved', true)
      .then(async ({ data: matches }) => {
        if (!matches?.length) { setLoading(false); return }

        const { data } = await supabase
          .from('opportunities')
          .select('*')
          .in('id', matches.map(m => m.opportunity_id))
          .in('status', ['approved', 'featured'])

        const enriched = (data || []).map(opp => {
          const match = matches.find(m => m.opportunity_id === opp.id)
          return { ...opp, match_score: match?.match_score || 50 }
        })

        setOpportunities(enriched as unknown as Opportunity[])
        setLoading(false)
      })
  }, [user])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Saved Opportunities</h1>
      <p className="text-gray-600">Opportunities you have saved for later</p>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : opportunities.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No saved opportunities yet</h3>
            <p className="text-gray-500">Save opportunities you are interested in to find them here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {opportunities.map(opp => (
            <OpportunityCard key={opp.id} opportunity={opp} />
          ))}
        </div>
      )}
    </div>
  )
}
