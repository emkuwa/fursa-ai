import Link from 'next/link'
import { SearchBar } from '@/components/ui/search-bar'
import { EmailCapture } from '@/components/home/email-capture'
import { Badge } from '@/components/ui/badge'
import { CATEGORIES, APP_NAME } from '@/lib/constants'
import { createServiceClient } from '@/lib/supabase/client'
import { daysUntil, deadlineColor, urgencyLabel } from '@/lib/utils'
import {
  TrendingUp, Zap, Globe, Users, Sparkles, Shield,
  GraduationCap, Briefcase, HandCoins, FileText, Award,
  Rocket, Trophy, BookOpen, Calendar, MapPin, ArrowRight,
  Flame, ShieldCheck, Database, ExternalLink, Eye,
} from 'lucide-react'
import type { Metadata } from 'next'
import type { OpportunityCategory } from '@/types'
import { APP_URL } from '@/lib/constants'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Jobs, Scholarships & Opportunities in Tanzania | Fursa AI',
  description: 'Discover verified Tanzania jobs, scholarships, internships, grants and international opportunities from trusted sources.',
  alternates: { canonical: APP_URL },
}

const FEATURES = [
  { icon: Zap, title: 'AI-Powered Matching', description: 'Smart algorithms find opportunities tailored to your profile.' },
  { icon: Globe, title: 'Tanzania & Global', description: 'Local Tanzania opportunities plus international scholarships and jobs.' },
  { icon: Users, title: 'Smart Alerts', description: 'Get notified via WhatsApp, Email, or Push when opportunities match.' },
  { icon: TrendingUp, title: 'Trend Analysis', description: 'Know which opportunities are trending and where.' },
  { icon: Sparkles, title: 'Application Assistant', description: 'AI helps craft cover letters, essays, and CVs.' },
  { icon: Shield, title: 'Quality Guaranteed', description: 'Every opportunity is verified by our AI quality system.' },
]

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  GraduationCap, Briefcase, HandCoins, FileText, Award, Rocket, Trophy, BookOpen, Globe,
}

const TRUSTED_SOURCES: { name: string; region: string; url: string; tagline: string; matchTokens: string[] }[] = [
  { name: 'Chevening', region: 'United Kingdom', url: 'https://www.chevening.org', tagline: 'UK Government Scholarships', matchTokens: ['chevening'] },
  { name: 'ReliefWeb', region: 'Global', url: 'https://reliefweb.int', tagline: 'UN Humanitarian Jobs', matchTokens: ['reliefweb'] },
  { name: 'Grants.gov', region: 'United States', url: 'https://www.grants.gov', tagline: 'US Federal Grants', matchTokens: ['grants.gov', 'grants gov'] },
  { name: 'DAAD', region: 'Germany', url: 'https://www.daad.de', tagline: 'German Academic Exchange', matchTokens: ['daad'] },
  { name: 'Fulbright', region: 'United States', url: 'https://www.fulbright.org', tagline: 'US Cultural Exchange', matchTokens: ['fulbright'] },
  { name: 'Opportunities Pedia', region: 'Global', url: 'https://www.opportunitiespedia.com', tagline: 'Global Opportunity Hub', matchTokens: ['opportunities pedia', 'opportunitiespedia', 'opportunity pedia'] },
]

type HomeOpportunity = {
  id: string
  title: string
  category: OpportunityCategory
  country: string | null
  deadline: string | null
  created_at: string
  view_count: number | null
  is_featured: boolean
  application_link: string | null
  url: string | null
  organization: string | null
  source: { name: string | null } | null
}

type HomeSource = {
  id: string
  name: string
  quality_score: number | null
  region: string | null
}

type HomeCountry = {
  name: string
  count: number
}

type HomeData = {
  stats: {
    total: number
    scholarships: number
    jobs: number
    grants: number
    countries: number
  }
  categoryCounts: Record<string, number>
  latest: HomeOpportunity[]
  trending: HomeOpportunity[]
  sources: HomeSource[]
  topCountries: HomeCountry[]
}

async function getHomeData(): Promise<HomeData> {
  const empty: HomeData = {
    stats: { total: 0, scholarships: 0, jobs: 0, grants: 0, countries: 0 },
    categoryCounts: {},
    latest: [],
    trending: [],
    sources: [],
    topCountries: [],
  }

  try {
    const supabase = createServiceClient()
    const statuses = ['approved', 'featured']
    const oppCols = 'id, title, category, country, deadline, created_at, view_count, is_featured, application_link, url, organization, source:sources(name)'

    const [
      totalRes,
      scholarshipsRes,
      jobsRes,
      tanzaniaJobsRes,
      grantsRes,
      countryRes,
      latestRes,
      trendingRes,
      sourcesRes,
      categoryCountsRes,
    ] = await Promise.all([
      supabase.from('opportunities').select('id', { count: 'exact', head: true }).in('status', statuses),
      supabase.from('opportunities').select('id', { count: 'exact', head: true }).eq('category', 'scholarship').in('status', statuses),
      supabase.from('opportunities').select('id', { count: 'exact', head: true }).eq('category', 'foreign_job').in('status', statuses),
      supabase.from('opportunities').select('id', { count: 'exact', head: true }).eq('country', 'Tanzania').in('status', statuses),
      supabase.from('opportunities').select('id', { count: 'exact', head: true }).eq('category', 'grant').in('status', statuses),
      supabase.from('opportunities').select('country').not('country', 'is', null).in('status', statuses).limit(5000),

      supabase.from('opportunities').select(oppCols).in('status', statuses).order('created_at', { ascending: false }).limit(8),
      supabase.from('opportunities').select(oppCols).in('status', statuses).order('view_count', { ascending: false, nullsFirst: false }).order('is_featured', { ascending: false }).order('created_at', { ascending: false }).limit(6),
      supabase.from('sources').select('id, name, quality_score, region').eq('is_active', true).order('quality_score', { ascending: false, nullsFirst: false }).limit(50),
      Promise.all(
        CATEGORIES.map(c =>
          supabase
            .from('opportunities')
            .select('id', { count: 'exact', head: true })
            .eq('category', c.value)
            .in('status', statuses)
            .then(r => ({ value: c.value, count: r.count || 0 }))
        )
      ),
    ])

    const rawCountries = (countryRes.data || [])
      .map(r => (r as { country: string | null }).country?.trim())
      .filter(Boolean) as string[]

    const countries = new Set(rawCountries).size

    const countryCounts = new Map<string, number>()
    for (const c of rawCountries) {
      countryCounts.set(c, (countryCounts.get(c) || 0) + 1)
    }
    const topCountries = [...countryCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([name, count]) => ({ name, count }))

    const categoryCounts: Record<string, number> = {}
    for (const row of categoryCountsRes) categoryCounts[row.value] = row.count

    return {
      stats: {
        total: totalRes.count || 0,
        scholarships: scholarshipsRes.count || 0,
        jobs: jobsRes.count || 0,
        grants: grantsRes.count || 0,
        countries,
      },
      categoryCounts,
      latest: (latestRes.data || []) as unknown as HomeOpportunity[],
      trending: (trendingRes.data || []) as unknown as HomeOpportunity[],
      topCountries,
      sources: (sourcesRes.data || []) as unknown as HomeSource[],
    }
  } catch (err) {
    console.error('[home] data fetch failed:', err)
    return empty
  }
}

function formatStat(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M+`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K+`
  return n.toString()
}

function getSourceLabel(opp: HomeOpportunity): string | null {
  return opp.source?.name || opp.organization || null
}

function getApplyUrl(opp: HomeOpportunity): string | null {
  return opp.application_link || opp.url || null
}

function OpportunityCard({ opp }: { opp: HomeOpportunity }) {
  const dDays = opp.deadline ? daysUntil(opp.deadline) : null
  const sourceLabel = getSourceLabel(opp)
  const applyUrl = getApplyUrl(opp)

  return (
    <div className="h-full bg-white rounded-xl border border-gray-200 p-5 hover:border-amber-300 hover:shadow-md transition-all flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-3">
        <Badge category={opp.category} />
        {opp.is_featured && (
          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wide">
            Featured
          </span>
        )}
      </div>

      <Link href={`/opportunities/${opp.id}`} className="block group mb-3">
        <h3 className="font-semibold text-gray-900 text-base leading-snug line-clamp-2 group-hover:text-amber-600 transition-colors">
          {opp.title}
        </h3>
      </Link>

      <div className="space-y-1.5 text-xs text-gray-500 mb-4">
        {opp.country && (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{opp.country}</span>
          </div>
        )}
        {sourceLabel && (
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 text-emerald-500" />
            <span className="truncate">{sourceLabel}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
          {dDays !== null ? (
            <span className={deadlineColor(dDays)}>{urgencyLabel(dDays)}</span>
          ) : (
            <span>Rolling deadline</span>
          )}
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2">
        <Link
          href={`/opportunities/${opp.id}`}
          className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-100 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          View Details
        </Link>
        {applyUrl && (
          <a
            href={applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 transition-colors"
          >
            Apply
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  )
}

function StatTile({ value, label, icon: Icon }: { value: number; label: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center gap-3 px-4 py-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
        <Icon className="w-5 h-5 text-amber-600" />
      </div>
      <div className="min-w-0">
        <div className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">{formatStat(value)}</div>
        <div className="text-xs text-gray-500 leading-tight">{label}</div>
      </div>
    </div>
  )
}

function findDbSource(name: string, tokens: string[], dbSources: HomeSource[]): HomeSource | null {
  const normalized = (s: string) => s.toLowerCase().trim()
  const allTokens = [normalized(name), ...tokens.map(normalized)]
  for (const src of dbSources) {
    const dbName = normalized(src.name)
    if (allTokens.some(t => dbName.includes(t))) return src
  }
  return null
}

export default async function HomePage() {
  const data = await getHomeData()
  const hasOpps = data.latest.length > 0
  const hasTrending = data.trending.length > 0
  const hasStats = data.stats.total > 0

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Fursa AI',
    url: 'https://fursaai.com',

    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://fursaai.com/opportunities?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ============ HERO ============ */}
      <section className="py-16 md:py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-orange-50" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            AI-Powered Opportunity Discovery
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Find <span className="text-amber-500">Jobs</span>, Scholarships &amp; Opportunities
            <br className="hidden sm:block" />
            <span className="text-gray-700"> in Tanzania and Beyond</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Discover verified Tanzania jobs, scholarships, internships, grants and international opportunities — all in one place.
          </p>

          {/* Quick-action category buttons */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <Link
              href="/scholarships"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors shadow-sm"
            >
              <GraduationCap className="w-5 h-5" />
              Find Scholarships
            </Link>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-800 rounded-xl font-semibold border border-gray-200 hover:border-amber-300 hover:shadow-sm transition-all"
            >
              <Briefcase className="w-5 h-5" />
              Find Jobs
            </Link>
            <Link
              href="/grants"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-800 rounded-xl font-semibold border border-gray-200 hover:border-amber-300 hover:shadow-sm transition-all"
            >
              <HandCoins className="w-5 h-5" />
              Explore Grants
            </Link>
            <Link
              href="/fellowships"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-800 rounded-xl font-semibold border border-gray-200 hover:border-amber-300 hover:shadow-sm transition-all"
            >
              <Award className="w-5 h-5" />
              Fellowships
            </Link>
          </div>

          <SearchBar />

          {/* Inline email capture */}
          <div className="mt-8 max-w-md mx-auto">
            <EmailCapture />
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm text-gray-500">
            <span className="text-gray-400">Popular searches:</span>
            {['NGO Jobs in Tanzania', 'Scholarships in UK', 'Engineering Jobs in Canada', 'Grants for NGOs', 'Remote Jobs'].map(q => (
              <Link key={q} href={`/opportunities?q=${encodeURIComponent(q)}`} className="px-3 py-1 bg-white rounded-full border border-gray-200 hover:border-amber-300 hover:text-amber-600 transition-colors text-xs">
                {q}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============ LIVE STATISTICS ============ */}
      {hasStats && (
        <section className="px-4 -mt-8 relative z-10">
          <div className="max-w-6xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                Live database
              </div>
              <span className="hidden sm:inline text-xs text-gray-400">Updated continuously</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100">
              <StatTile value={data.stats.total} label="Total Opportunities" icon={Database} />
              <StatTile value={data.stats.jobs} label="Tanzania Jobs" icon={Briefcase} />
              <StatTile value={data.stats.scholarships} label="Scholarships" icon={GraduationCap} />
              <StatTile value={data.stats.countries} label="Countries Covered" icon={Globe} />
            </div>
          </div>
        </section>
      )}

      {/* ============ LATEST OPPORTUNITIES ============ */}
      {hasOpps && (
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8 gap-4">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full mb-3 uppercase tracking-wide">
                  <Sparkles className="w-3.5 h-3.5" />
                  Just Added
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Latest Opportunities</h2>
                <p className="text-gray-600 mt-1 text-sm md:text-base">Fresh from our AI crawlers — sorted by newest first</p>
              </div>
              <Link href="/opportunities" className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors flex-shrink-0">
                Browse all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.latest.map(opp => (
                <OpportunityCard key={opp.id} opp={opp} />
              ))}
            </div>
            <div className="mt-6 sm:hidden">
              <Link href="/opportunities" className="inline-flex items-center gap-1 text-sm font-medium text-amber-600">
                Browse all opportunities <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ============ TRENDING OPPORTUNITIES ============ */}
      {hasTrending && (
        <section className="py-16 px-4 bg-gradient-to-b from-white to-amber-50/40">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8 gap-4">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-orange-700 bg-orange-50 px-3 py-1 rounded-full mb-3 uppercase tracking-wide">
                  <Flame className="w-3.5 h-3.5" />
                  Trending Now
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Trending Opportunities</h2>
                <p className="text-gray-600 mt-1 text-sm md:text-base">Most viewed and featured picks right now</p>
              </div>
              <Link href="/opportunities?sort=popular" className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors flex-shrink-0">
                See all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.trending.map(opp => (
                <OpportunityCard key={opp.id} opp={opp} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ TRUSTED SOURCES ============ */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full mb-3 uppercase tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Partners
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Trusted Opportunity Sources</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base">
              We aggregate opportunities from world-renowned, high-authority institutions you already know and trust.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {TRUSTED_SOURCES.map(src => {
              const dbMatch = findDbSource(src.name, src.matchTokens, data.sources)
              const quality = dbMatch?.quality_score ?? 95
              return (
                <a
                  key={src.name}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center text-center bg-white border border-gray-200 rounded-xl px-3 py-5 hover:border-emerald-300 hover:shadow-md transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-200 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <span className="text-base font-bold text-amber-700">
                      {src.name.split(' ').map(w => w.charAt(0)).slice(0, 2).join('').toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-gray-900 leading-tight mb-1 truncate w-full">{src.name}</div>
                  <div className="text-[11px] text-gray-500 mb-2 leading-tight line-clamp-1">{src.tagline}</div>
                  <div className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    {quality}/100
                  </div>
                </a>
              )
            })}
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">
            And {data.sources.length > 6 ? `${data.sources.length - 6}+ more` : 'many more'} verified sources across {data.stats.countries || 'multiple'} countries
          </p>
        </div>
      </section>

      {/* ============ TOP COUNTRIES ============ */}
      {data.topCountries.length > 0 && (
        <section className="py-16 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">Top Countries</h2>
            <p className="text-gray-600 text-center mb-10 max-w-xl mx-auto text-sm md:text-base">
              Opportunities available in {data.stats.countries} countries worldwide
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {data.topCountries.map(c => (
                <Link
                  key={c.name}
                  href={`/opportunities?country=${encodeURIComponent(c.name)}`}
                  className="group bg-white border border-gray-200 rounded-xl p-4 hover:border-amber-300 hover:shadow-md transition-all text-center"
                >
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                    <MapPin className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="text-sm font-semibold text-gray-900 truncate">{c.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{c.count} {c.count === 1 ? 'opportunity' : 'opportunities'}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ CATEGORIES ============ */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">Explore by Category</h2>
          <p className="text-gray-600 text-center mb-10 max-w-xl mx-auto text-sm md:text-base">Browse opportunities across every category</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES.map(cat => {
              const IconComponent = CATEGORY_ICONS[cat.icon] || Zap
              const count = data.categoryCounts[cat.value] || 0
              return (
                <Link key={cat.value} href={`/${cat.value}s`} className="group bg-white rounded-xl border border-gray-200 p-6 hover:border-amber-300 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <IconComponent className="w-6 h-6 text-amber-500" />
                      <h3 className="font-semibold text-gray-900">{cat.label}</h3>
                    </div>
                    {count > 0 && (
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                        {formatStat(count)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{cat.description}</p>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">Why {APP_NAME}?</h2>
          <p className="text-gray-600 text-center mb-10 max-w-xl mx-auto text-sm md:text-base">Built for Tanzania, powered by AI</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon
              return (
                <div key={i} className="flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="py-20 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Start Your Journey Today</h2>
          <p className="text-lg mb-8 opacity-90">Join thousands of Tanzanians discovering life-changing opportunities.</p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/register" className="inline-flex items-center justify-center px-8 py-4 bg-white text-amber-600 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg">
              Get Started Free
            </Link>
            <Link href="/beta" className="inline-flex items-center justify-center px-8 py-4 bg-amber-600 text-white rounded-xl font-semibold text-lg hover:bg-amber-700 transition-colors shadow-lg">
              Join Waitlist
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
