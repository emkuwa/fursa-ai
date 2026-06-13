'use client'

import { useCallback } from 'react'

type TrackEvent = {
  event_type: string
  opportunity_id?: string
  category?: string
  country?: string
  metadata?: Record<string, unknown>
}

export function useAnalytics() {
  const track = useCallback(async (event: TrackEvent) => {
    try {
      const res = await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      })
      if (!res.ok) {
        const data = await res.json()
        console.error('[analytics] tracking failed:', data.message)
      }
    } catch (err) {
      console.error('[analytics] track error:', err)
    }
  }, [])

  return { track }
}
