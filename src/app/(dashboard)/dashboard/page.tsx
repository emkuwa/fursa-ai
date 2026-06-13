'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/use-user'
import { useOpportunities } from '@/lib/hooks/use-opportunities'
import { OpportunityCard } from '@/components/opportunities/opportunity-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Sparkles, TrendingUp, Heart, FileText, ArrowRight, Bell } from 'lucide-react'
import type { Opportunity } from '@/types'

export default function DashboardPage() {
  const { user, profile, loading: userLoading } = useUser()
  const [matches, setMatches] = useState<Opportunity[]>([])
  const [stats, setStats] = useState({ saved: 0, matches: 0, applications: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const supabase = createClient()

    Promise.all([
      supabase.from('user_matches').select('opportunity_id, match_score').eq('user_id', user.id).order('match_score', { ascending: false }).limit(6),
      supabase.from('user_matches').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_saved', true),
      supabase.from('user_matches').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_applied', true),
    ]).then(([matchesRes, savedCount, appliedCount]) => {
      setStats({
        saved: savedCount.count || 0,
        matches: matchesRes.data?.length || 0,
        applications: appliedCount.count || 0,
      })

      if (matchesRes.data?.length) {
        supabase.from('opportunities').select('*').in('id', matchesRes.data.map(m => m.opportunity_id)).in('status', ['approved', 'featured']).then(({ data }) => {
          if (data) {
            const enriched = data.map(opp => {
              const match = matchesRes.data!.find(m => m.opportunity_id === opp.id)
              return { ...opp, match_score: match?.match_score || 50 }
            })
            setMatches(enriched as unknown as Opportunity[])
          }
          setLoading(false)
        })
      } else {
        setLoading(false)
      }
    })
  }, [user])

  if (userLoading || loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}!</h1>
          <p className="text-gray-600">Here are your personalized opportunities</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.matches}</p>
              <p className="text-sm text-gray-500">New Matches</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.saved}</p>
              <p className="text-sm text-gray-500">Saved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.applications}</p>
              <p className="text-sm text-gray-500">Applications</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Top Matches For You</h2>
          <Link href="/opportunities">
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
        {matches.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No matches yet</h3>
              <p className="text-gray-500 mb-4">Complete your profile to get personalized matches.</p>
              <Link href="/dashboard/profile">
                <Button>Complete Profile</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map(opp => (
              <OpportunityCard key={opp.id} opportunity={opp} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
