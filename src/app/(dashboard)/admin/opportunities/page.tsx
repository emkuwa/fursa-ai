'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, categoryLabel, daysUntil, deadlineColor } from '@/lib/utils'
import { CheckCircle, XCircle, Eye } from 'lucide-react'
import type { Opportunity } from '@/types'

export default function AdminOpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')

  const loadOpportunities = async () => {
    setLoading(true)
    const supabase = createClient()

    let query = supabase.from('opportunities').select('*')

    if (filter === 'all') {
      // no filter
    } else {
      query = query.eq('status', filter)
    }

    const { data } = await query.order('created_at', { ascending: false }).limit(50)
    setOpportunities((data || []) as unknown as Opportunity[])
    setLoading(false)
  }

  useEffect(() => { loadOpportunities() }, [filter])

  const updateStatus = async (id: string, status: string) => {
    const supabase = createClient()
    await supabase.from('opportunities').update({ status }).eq('id', id)
    loadOpportunities()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Opportunity Management</h1>
          <p className="text-gray-600">Review, approve, or reject opportunities</p>
        </div>
        <Button variant="outline" onClick={loadOpportunities}>Refresh</Button>
      </div>

      <div className="flex gap-2">
        {['pending', 'approved', 'featured', 'rejected', 'all'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === s ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {opportunities.map(opp => (
            <Card key={opp.id}>
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge category={opp.category} />
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      opp.status === 'approved' ? 'bg-green-100 text-green-700' :
                      opp.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      opp.status === 'featured' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>{opp.status}</span>
                  </div>
                  <h3 className="font-medium text-gray-900 truncate">{opp.title}</h3>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span>{opp.organization || 'Unknown'}</span>
                    <span>{opp.country || 'Various'}</span>
                    {opp.deadline && <span className={deadlineColor(daysUntil(opp.deadline))}>{formatDate(opp.deadline)}</span>}
                    <span>Quality: {opp.quality_score || 'N/A'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <a href={`/opportunities/${opp.id}`} target="_blank">
                    <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                  </a>
                  {opp.status === 'pending' && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => updateStatus(opp.id, 'approved')} className="text-green-600">
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => updateStatus(opp.id, 'rejected')} className="text-red-600">
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {opportunities.length === 0 && (
            <p className="text-center text-gray-500 py-8">No opportunities found</p>
          )}
        </div>
      )}
    </div>
  )
}
