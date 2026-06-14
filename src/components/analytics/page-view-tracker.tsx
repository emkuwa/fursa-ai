'use client'

import { useEffect } from 'react'
import { useAnalytics } from '@/lib/hooks/use-analytics'

export function PageViewTracker({ page }: { page: string }) {
  const { track } = useAnalytics()

  useEffect(() => {
    track({ event_type: 'view', metadata: { page } })
  }, [page, track])

  return null
}
