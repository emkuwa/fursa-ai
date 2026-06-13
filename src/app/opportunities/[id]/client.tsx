'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useAnalytics } from '@/lib/hooks/use-analytics'
import { daysUntil, deadlineColor, urgencyLabel, difficultyLabel, formatDate } from '@/lib/utils'
import { ArrowLeft, ExternalLink, Calendar, MapPin, Building2, Clock, FileText, Save, Share2, CheckCircle2, AlertTriangle, BookmarkPlus } from 'lucide-react'
import type { Opportunity } from '@/types'

export default function OpportunityDetailClient() {
  const params = useParams()
  const router = useRouter()
  const { track } = useAnalytics()
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })

    supabase
      .from('opportunities')
      .select('*')
      .eq('id', params.id)
      .single()
      .then(({ data }) => {
        setOpportunity(data as unknown as Opportunity)
        setLoading(false)

        if (data) {
          supabase.rpc('increment_view_count', { opp_id: params.id }).maybeSingle()
          track({
            event_type: 'view',
            opportunity_id: params.id as string,
            category: (data as Opportunity).category,
            country: (data as Opportunity).country || undefined,
          })
        }
      })
  }, [params.id, track])

  const handleSave = async () => {
    if (!user) { router.push('/login'); return }
    const supabase = createClient()

    if (!saved) {
      await supabase
        .from('user_matches')
        .upsert({
          user_id: user.id,
          opportunity_id: params.id as string,
          match_score: opportunity?.match_score || 50,
          is_saved: true,
        })
      setSaved(true)
      track({
        event_type: 'save',
        opportunity_id: params.id as string,
        category: opportunity?.category,
        country: opportunity?.country || undefined,
      })
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  if (!opportunity) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Opportunity Not Found</h2>
        <p className="text-gray-500 mb-6">This opportunity may have expired or been removed.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  const deadlineDays = opportunity.deadline ? daysUntil(opportunity.deadline) : null

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to opportunities
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <Badge category={opportunity.category} />
            {opportunity.is_featured && (
              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Featured</span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{opportunity.title}</h1>
          {opportunity.organization && (
            <div className="flex items-center gap-2 text-gray-600">
              <Building2 className="w-4 h-4" />
              <span>{opportunity.organization}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSave}>
            {saved ? <CheckCircle2 className="w-4 h-4 mr-1 text-green-500" /> : <BookmarkPlus className="w-4 h-4 mr-1" />}
            {saved ? 'Saved' : 'Save'}
          </Button>
          <Button variant="ghost" size="sm"><Share2 className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Deadline</p>
              <p className={deadlineDays !== null ? `font-medium ${deadlineColor(deadlineDays)}` : 'font-medium'}>
                {opportunity.deadline ? formatDate(opportunity.deadline) : 'Open / Rolling'}
              </p>
              {deadlineDays !== null && (
                <p className="text-xs text-gray-400">{urgencyLabel(deadlineDays)}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <MapPin className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Location</p>
              <p className="font-medium">{opportunity.country || 'Various'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Difficulty</p>
              <p className={`font-medium ${opportunity.difficulty_score ? `text-${difficultyLabel(opportunity.difficulty_score).toLowerCase() === 'hard' ? 'red' : difficultyLabel(opportunity.difficulty_score).toLowerCase() === 'medium' ? 'amber' : 'green'}-600` : ''}`}>
                {opportunity.difficulty_score ? `${difficultyLabel(opportunity.difficulty_score)} (${opportunity.difficulty_score}/100)` : 'Not rated'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {opportunity.summary && (
            <section>
              <h2 className="text-xl font-semibold mb-3">Summary</h2>
              <p className="text-gray-700 leading-relaxed">{opportunity.summary}</p>
            </section>
          )}

          <section>
            <h2 className="text-xl font-semibold mb-3">Full Description</h2>
            <div className="text-gray-700 leading-relaxed whitespace-pre-line">{opportunity.description}</div>
          </section>

          {opportunity.benefits && (
            <section>
              <h2 className="text-xl font-semibold mb-3">Key Benefits</h2>
              <p className="text-gray-700 leading-relaxed">{opportunity.benefits}</p>
            </section>
          )}

          {opportunity.eligibility && (
            <section>
              <h2 className="text-xl font-semibold mb-3">Eligibility</h2>
              <p className="text-gray-700 leading-relaxed">{opportunity.eligibility}</p>
            </section>
          )}

          {opportunity.required_documents && opportunity.required_documents.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-3">Required Documents</h2>
              <ul className="space-y-2">
                {opportunity.required_documents.map((doc, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-700">
                    <FileText className="w-4 h-4 text-amber-500" />
                    {doc}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {opportunity.tags && opportunity.tags.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-3">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {opportunity.tags.map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">{tag}</span>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">Actions</h3>
              <div className="space-y-3">
                <a
                  href={opportunity.application_link || opportunity.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track({
                    event_type: 'click',
                    opportunity_id: params.id as string,
                    category: opportunity?.category,
                    country: opportunity?.country || undefined,
                    metadata: { action: 'apply' },
                  })}
                >
                  <Button className="w-full">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Apply Now
                  </Button>
                </a>
                <Button variant="outline" className="w-full" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  {saved ? 'Saved' : 'Save for Later'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {opportunity.quality_score && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Quality Score</h3>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${opportunity.quality_score}%` }} />
                  </div>
                  <span className="text-lg font-bold text-amber-600">{opportunity.quality_score}%</span>
                </div>
              </CardContent>
            </Card>
          )}

          {opportunity.match_score && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Your Match</h3>
                <div className="text-center">
                  <span className="text-3xl font-bold text-amber-500">{opportunity.match_score}%</span>
                  <p className="text-sm text-gray-500 mt-1">Match Score</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
