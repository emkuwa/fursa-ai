#!/usr/bin/env npx tsx
/**
 * PHASE 36B — Search Validation Script
 * Run: npx tsx scripts/validate-search.ts
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

function loadEnv() {
  try {
    const envPath = resolve(import.meta.dirname, '../.env.local')
    const content = readFileSync(envPath, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim()
      if (!process.env[key]) process.env[key] = val
    }
  } catch {}
}

loadEnv()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
}

async function supabaseQuery(params: Record<string, string>) {
  const url = `${SUPABASE_URL}/rest/v1/opportunities`
  const qs = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&')
    // PostgREST needs literal parentheses for operators like in.() — restore them
    .replace(/%28/g, '(').replace(/%29/g, ')').replace(/%2C/g, ',')
  const res = await fetch(`${url}?${qs}`, {
    headers: { ...headers, Prefer: 'count=exact' },
  })
  const contentRange = res.headers.get('content-range')
  const totalMatch = contentRange?.match(/\/(\d+)/)
  const total = totalMatch ? parseInt(totalMatch[1]) : 0
  const data = await res.json()
  return { data: Array.isArray(data) ? data : [], total }
}

type OpportunityCategory =
  | 'scholarship' | 'foreign_job' | 'grant' | 'tender' | 'fellowship'
  | 'startup_funding' | 'competition' | 'internship' | 'exchange_program'

const CATEGORY_KEYWORDS: Record<string, OpportunityCategory[]> = {
  job: ['foreign_job'],
  jobs: ['foreign_job'],
  work: ['foreign_job'],
  employment: ['foreign_job'],
  career: ['foreign_job'],
  scholarship: ['scholarship'],
  scholarships: ['scholarship'],
  study: ['scholarship'],
  education: ['scholarship'],
  grant: ['grant'],
  grants: ['grant'],
  funding: ['grant', 'startup_funding'],
  fellowship: ['fellowship'],
  fellowships: ['fellowship'],
  tender: ['tender'],
  tenders: ['tender'],
  internship: ['internship'],
  internships: ['internship'],
  competition: ['competition'],
  competitions: ['competition'],
  startup: ['startup_funding'],
  exchange: ['exchange_program'],
}

function expandSearchTerms(query: string) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const matchedCategories: OpportunityCategory[] = []
  const remainingWords: string[] = []

  for (const word of words) {
    const cleaned = word.replace(/[^a-z]/g, '')
    if (CATEGORY_KEYWORDS[cleaned]) {
      matchedCategories.push(...CATEGORY_KEYWORDS[cleaned])
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
  return `(${fields.map(f => `${f}.ilike.*${q}*`).join(',')})`
}

async function searchOpportunities(rawQuery: string) {
  const { textQuery, categories } = expandSearchTerms(rawQuery)

  const params: Record<string, string> = {
    select: 'id,title,category,country,organization,tags',
    status: 'in.(approved,featured)',
    order: 'quality_score.desc.nullslast',
    limit: '10',
  }

  if (textQuery) {
    params.or = buildSearchFilter(textQuery)
  }

  if (categories.length > 0) {
    params.category = `in.(${categories.join(',')})`
  }

  const { data, total } = await supabaseQuery(params)
  return { data, count: total }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗')
  console.log('║   PHASE 36B — SEARCH VALIDATION REPORT             ║')
  console.log('╚══════════════════════════════════════════════════════╝')
  console.log()

  // Get total counts per category
  const categories: [string, string][] = [
    ['foreign_job', 'Foreign Jobs'],
    ['scholarship', 'Scholarships'],
    ['grant', 'Grants'],
    ['fellowship', 'Fellowships'],
    ['internship', 'Internships'],
    ['competition', 'Competitions'],
    ['tender', 'Tenders'],
    ['startup_funding', 'Startup Funding'],
    ['exchange_program', 'Exchange Programs'],
  ]

  let totalAll = 0
  console.log('📊 DATABASE TOTALS (approved/featured only):')

  for (const [cat, label] of categories) {
    const { total } = await supabaseQuery({
      select: 'id',
      status: 'in.(approved,featured)',
      category: `eq.${cat}`,
      limit: '0',
    })
    console.log(`   ${label.padEnd(20)} ${total}`)
    totalAll += total
  }
  console.log(`   ${'─'.repeat(28)}`)
  console.log(`   ${'Total'.padEnd(20)} ${totalAll}`)
  console.log()

  const testQueries = [
    'jobs',
    'ngo jobs',
    'un jobs',
    'remote jobs',
    'tanzania jobs',
    'scholarship',
    'grant',
    'fellowship',
    'tanzania',
    'kenya',
    'united nations',
    'undp',
    'who',
    'world bank',
  ]

  console.log('🔍 SEARCH VALIDATION TESTS:')
  console.log('═'.repeat(60))

  let passed = 0
  let failed = 0

  for (const q of testQueries) {
    const result = await searchOpportunities(q)

    const hasResults = result.count > 0
    const status = hasResults ? '✅ PASS' : '❌ FAIL'

    if (hasResults) passed++
    else failed++

    console.log()
    console.log(`${status} | Search: "${q}"`)
    console.log(`   Results: ${result.count} found`)

    if (result.data.length > 0) {
      console.log('   Sample:')
      for (const opp of result.data.slice(0, 3)) {
        console.log(`     • ${opp.title}`)
        console.log(`       Category: ${opp.category} | Country: ${opp.country || 'N/A'} | Org: ${opp.organization || 'N/A'}`)
        if (opp.tags?.length) console.log(`       Tags: ${opp.tags.slice(0, 5).join(', ')}`)
      }
    }
  }

  console.log()
  console.log('═'.repeat(60))
  console.log(`📊 SUMMARY: ${passed} passed, ${failed} failed, ${testQueries.length} total`)
  console.log('═'.repeat(60))

  if (failed > 0) process.exit(1)
}

main().catch(console.error)
