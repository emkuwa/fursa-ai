'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Opportunity, SearchFilters } from '@/types'

export function useOpportunities(filters?: SearchFilters) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  const fetch = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    let query = supabase
      .from('opportunities')
      .select('*', { count: 'exact' })
      .in('status', ['approved', 'featured'])

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    if (filters?.country) {
      query = query.eq('country', filters.country)
    }

    if (filters?.query) {
      query = query.textSearch('title', filters.query, {
        type: 'websearch',
        config: 'english',
      })
    }

    if (filters?.min_quality_score) {
      query = query.gte('quality_score', filters.min_quality_score)
    }

    const sortBy = filters?.sort_by || 'created_at'
    const sortOrder = filters?.sort_order || 'desc'
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    const page = filters?.page || 1
    const limit = filters?.limit || 20
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data, count } = await query

    setOpportunities((data || []) as unknown as Opportunity[])
    setTotal(count || 0)
    setLoading(false)
  }, [filters])

  useEffect(() => { fetch() }, [fetch])

  return { opportunities, loading, total, refetch: fetch }
}

export function useSavedOpportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return }

      supabase
        .from('user_matches')
        .select('opportunity_id')
        .eq('user_id', user.id)
        .eq('is_saved', true)
        .then(async ({ data: matches }) => {
          if (!matches?.length) { setLoading(false); return }

          const { data } = await supabase
            .from('opportunities')
            .select('*')
            .in('id', matches.map(m => m.opportunity_id))
            .in('status', ['approved', 'featured'])

          setOpportunities((data || []) as unknown as Opportunity[])
          setLoading(false)
        })
    })
  }, [])

  return { opportunities, loading }
}
