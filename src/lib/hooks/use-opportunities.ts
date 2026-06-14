'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { Opportunity, SearchFilters, OpportunityCategory } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
let _dataClient: ReturnType<typeof createClient> | null = null
function getDataClient() {
  if (!_dataClient) {
    _dataClient = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-key', {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    })
  }
  return _dataClient
}

const SEARCH_SYNONYMS: Record<string, string> = {
  vacancy: 'job', vacancies: 'jobs', employment: 'jobs', employed: 'jobs',
  hiring: 'jobs', recruit: 'jobs', recruitment: 'jobs', position: 'jobs',
  bursary: 'scholarship', bursaries: 'scholarships',
  funding: 'grant', fund: 'grant', financed: 'grant',
  training: 'internship', workshop: 'internship', program: 'internship',
  challenge: 'competition', hackathon: 'competition',
  procurement: 'tender', rfp: 'tender', rfq: 'tender',
  workfromhome: 'remote', wfh: 'remote', telecommute: 'remote',
  freelance: 'remote', distributed: 'remote', anywhere: 'remote',
}

const CATEGORY_KEYWORDS: Record<string, OpportunityCategory[]> = {
  job: ['foreign_job'],
  jobs: ['foreign_job'],
  work: ['foreign_job'],
  employment: ['foreign_job'],
  career: ['foreign_job'],
  vacancy: ['foreign_job'],
  vacancies: ['foreign_job'],
  hiring: ['foreign_job'],
  recruit: ['foreign_job'],
  recruitment: ['foreign_job'],
  position: ['foreign_job'],
  scholarship: ['scholarship'],
  scholarships: ['scholarship'],
  study: ['scholarship'],
  education: ['scholarship'],
  bursary: ['scholarship'],
  bursaries: ['scholarship'],
  grant: ['grant'],
  grants: ['grant'],
  funding: ['grant', 'startup_funding'],
  fund: ['grant'],
  fellowship: ['fellowship'],
  fellowships: ['fellowship'],
  tender: ['tender'],
  tenders: ['tender'],
  procurement: ['tender'],
  rfp: ['tender'],
  internship: ['internship'],
  internships: ['internship'],
  training: ['internship'],
  workshop: ['internship'],
  program: ['internship'],
  competition: ['competition'],
  competitions: ['competition'],
  challenge: ['competition'],
  hackathon: ['competition'],
  startup: ['startup_funding'],
  exchange: ['exchange_program'],
}

function expandSearchTerms(query: string): { textQuery: string | null; categories: OpportunityCategory[] } {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const matchedCategories: OpportunityCategory[] = []
  const remainingWords: string[] = []

  for (const word of words) {
    const cleaned = word.replace(/[^a-z]/g, '')
    const expanded = SEARCH_SYNONYMS[cleaned] || cleaned
    if (CATEGORY_KEYWORDS[expanded]) {
      matchedCategories.push(...CATEGORY_KEYWORDS[expanded])
    } else {
      remainingWords.push(word)
    }
  }

  const uniqueCategories = [...new Set(matchedCategories)]
  const textQuery = remainingWords.length > 0 ? remainingWords.join(' ') : null

  return { textQuery, categories: uniqueCategories }
}

function buildSearchFilter(query: string): string {
  const q = query.replace(/%/g, '').replace(/\*/g, '')
  const fields = ['title', 'description', 'summary', 'organization', 'country']
  return fields.map(f => `${f}.ilike.*${q}*`).join(',')
}

export function useOpportunities(filters?: SearchFilters) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  const fetch = useCallback(async () => {
    setLoading(true)
    const supabase = getDataClient()

    let query = supabase
      .from('opportunities')
      .select('*', { count: 'exact' })
      .in('status', ['approved', 'featured'])

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    if (filters?.country) {
      query = query.ilike('country', `%${filters.country}%`)
    }

    if (filters?.query) {
      const { textQuery, categories } = expandSearchTerms(filters.query)

      if (textQuery) {
        const searchFilter = buildSearchFilter(textQuery)
        query = query.or(searchFilter)
      }

      if (categories.length > 0 && !filters?.category) {
        query = query.in('category', categories)
      }
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

    const { data, count, error } = await query

    if (error) {
      console.error('Error fetching opportunities:', error)
      setOpportunities([])
      setTotal(0)
    } else {
      setOpportunities((data || []) as unknown as Opportunity[])
      setTotal(count || 0)
    }
    setLoading(false)
  }, [
    filters?.query,
    filters?.category,
    filters?.country,
    filters?.min_quality_score,
    filters?.page,
    filters?.limit,
    filters?.sort_by,
    filters?.sort_order
  ])

  useEffect(() => { fetch() }, [fetch])

  return { opportunities, loading, total, refetch: fetch }
}

export function useSavedOpportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getDataClient()
    import('@/lib/supabase/client').then(({ createClient: createSSRClient }) => {
      const ssrClient = createSSRClient()
      ssrClient.auth.getUser().then(({ data: { user } }) => {
        if (!user) { setLoading(false); return }
        supabase
          .from('user_matches')
          .select('opportunity_id')
          .eq('user_id', user.id)
          .eq('is_saved', true)
          .then(async ({ data: matches }) => {
            if (!matches?.length) { setLoading(false); return }
            const ids = (matches as unknown as { opportunity_id: string }[]).map(m => m.opportunity_id)
            const { data } = await supabase
              .from('opportunities')
              .select('*')
              .in('id', ids)
              .in('status', ['approved', 'featured'])
            setOpportunities((data || []) as unknown as Opportunity[])
            setLoading(false)
          })
      })
    })
  }, [])

  return { opportunities, loading }
}
