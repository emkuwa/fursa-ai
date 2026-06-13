'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { timeAgo, daysUntil, deadlineColor, urgencyLabel, truncate } from '@/lib/utils'
import { Calendar, MapPin, Building2, TrendingUp } from 'lucide-react'
import type { Opportunity } from '@/types'

interface OpportunityCardProps {
  opportunity: Opportunity
}

export function OpportunityCard({ opportunity: opp }: OpportunityCardProps) {
  const deadlineDays = opp.deadline ? daysUntil(opp.deadline) : null

  return (
    <Link href={`/opportunities/${opp.id}`}>
      <Card className="h-full hover:shadow-md hover:border-amber-200 transition-all group">
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-start justify-between mb-3">
            <Badge category={opp.category} />
            {opp.is_featured && (
              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                Featured
              </span>
            )}
          </div>

          <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-amber-600 transition-colors line-clamp-2">
            {opp.title}
          </h3>

          {opp.summary && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">
              {truncate(opp.summary, 150)}
            </p>
          )}

          <div className="space-y-2 text-sm text-gray-500 mt-auto">
            {opp.organization && (
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span>{opp.organization}</span>
              </div>
            )}
            {opp.country && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{opp.country}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {deadlineDays !== null ? (
                  <span className={deadlineColor(deadlineDays)}>{urgencyLabel(deadlineDays)}</span>
                ) : (
                  <span>No deadline</span>
                )}
              </div>
              {opp.quality_score && (
                <div className="flex items-center gap-1 text-xs font-medium text-gray-400">
                  <TrendingUp className="w-3 h-3" />
                  {opp.quality_score}%
                </div>
              )}
            </div>
          </div>

          {opp.match_score && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${opp.match_score}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-amber-600">{opp.match_score}% match</span>
              </div>
            </div>
          )}
        </div>
      </Card>
    </Link>
  )
}
