'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Bot, Users, Briefcase, TrendingUp, AlertTriangle, CheckCircle, DollarSign, Activity, Shield, Award, Heart, FileText, BarChart3, Globe, Share2, Zap, Search, Clock, Star } from 'lucide-react'

export default function AdminDashboardPage() {
  const [daily, setDaily] = useState<any>(null)
  const [recentTasks, setRecentTasks] = useState<any[]>([])
  const [categoryPerf, setCategoryPerf] = useState<any[]>([])
  const [metrics, setMetrics] = useState<any>(null)
  const [validation, setValidation] = useState<any>(null)
  const [searchQuality, setSearchQuality] = useState<any[]>([])
  const [whatsappResults, setWhatsappResults] = useState<any[]>([])
  const [pipelineResults, setPipelineResults] = useState<any[]>([])
  const [betaMetrics, setBetaMetrics] = useState<any>(null)
  const [runningPipeline, setRunningPipeline] = useState(false)
  const [runningQualityAudit, setRunningQualityAudit] = useState(false)
  const [runningWhatsappTests, setRunningWhatsappTests] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    Promise.all([
      supabase.from('opportunities').select('id', { count: 'exact', head: true }),
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('agent_tasks').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
      supabase.from('agent_tasks').select('id', { count: 'exact', head: true }).eq('status', 'running'),
      supabase.from('revenue_events').select('amount').gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      supabase.from('revenue_events').select('amount').gte('created_at', new Date().toISOString().split('T')[0]),
      supabase.from('agent_tasks').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('opportunities').select('category, count:category', { count: 'exact' }).in('status', ['approved', 'featured']),
      supabase.from('user_matches').select('id', { count: 'exact', head: true }).eq('is_saved', true),
      supabase.from('user_matches').select('id', { count: 'exact', head: true }).eq('is_applied', true),
      supabase.from('opportunities').select('id', { count: 'exact', head: true }).gte('created_at', new Date().toISOString().split('T')[0]),
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }).gte('created_at', new Date().toISOString().split('T')[0]),
      supabase.from('source_health').select('status'),
      supabase.from('opportunity_rankings').select('id', { count: 'exact', head: true }).gte('created_at', new Date().toISOString().split('T')[0]),
      supabase.from('daily_digests').select('id', { count: 'exact', head: true }).eq('date', new Date().toISOString().split('T')[0]),
      supabase.from('referrals').select('id', { count: 'exact', head: true }),
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('plan_tier', 'free'),
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }).in('plan_tier', ['premium', 'premium_plus', 'enterprise']),
      supabase.from('analytics_events').select('id', { count: 'exact', head: true }).gte('created_at', new Date().toISOString().split('T')[0]),
      supabase.from('analytics_events').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
      supabase.from('analytics_events').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
    ]).then(([
      opps, users, failed, running, revenue, todayRevenue,
      tasks, categories, savedCount, appCount,
      newOppsToday, newUsersToday, sourceHealth, rankingsToday,
      digestsToday, referralsTotal, freeUsers, premiumUsers,
      dau, wau, mau,
    ]) => {
      const totalRevenue = (revenue.data || []).reduce((sum: number, e: any) => sum + Number(e.amount), 0)
      const todayRev = (todayRevenue.data || []).reduce((sum: number, e: any) => sum + Number(e.amount), 0)

      const catCount: Record<string, number> = {}
      for (const c of (categories.data || []) as any[]) {
        catCount[c.category] = c.count
      }

      let healthy = 0; let degraded = 0; let dead = 0
      for (const sh of (sourceHealth.data || []) as any[]) {
        if (sh.status === 'healthy') healthy++
        else if (sh.status === 'degraded') degraded++
        else if (sh.status === 'dead') dead++
      }

      const total = (users.count || 0)
      const premium = (premiumUsers.count || 0)
      const convRate = total > 0 ? Math.round((premium / total) * 100) : 0

      setMetrics({
        dau: dau.count || 0,
        wau: wau.count || 0,
        mau: mau.count || 0,
        conversion_rate: convRate,
        total_users: total,
        premium_users: premium,
      })

      setDaily({
        total_opportunities: opps.count || 0,
        opportunities_by_category: catCount,
        opportunities_today: newOppsToday.count || 0,
        active_users: users.count || 0,
        new_users_today: newUsersToday.count || 0,
        total_matches: 0,
        avg_match_score: 0,
        revenue_mtd: totalRevenue,
        revenue_today: todayRev,
        active_agents: (running.count || 0),
        agent_errors: (failed.count || 0),
        source_health: { healthy, degraded, dead },
        total_saved: savedCount.count || 0,
        total_applications: appCount.count || 0,
        rankings_today: rankingsToday.count || 0,
        daily_digests: digestsToday.count || 0,
        referral_count: referralsTotal.count || 0,
        conversion_rate: convRate,
        dau: dau.count || 0,
        wau: wau.count || 0,
        mau: mau.count || 0,
      })

      setRecentTasks(tasks.data || [])
      setLoading(false)
    })

    // Fetch category performance
    Promise.all(
      ['scholarship', 'foreign_job', 'grant', 'tender', 'fellowship'].map(async (cat) => {
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
        const [viewsRes, savesRes, clicksRes] = await Promise.all([
          supabase.from('analytics_events').select('id', { count: 'exact', head: true })
            .eq('event_type', 'view').eq('category', cat).gte('created_at', sevenDaysAgo),
          supabase.from('analytics_events').select('id', { count: 'exact', head: true })
            .eq('event_type', 'save').eq('category', cat).gte('created_at', sevenDaysAgo),
          supabase.from('analytics_events').select('id', { count: 'exact', head: true })
            .eq('event_type', 'click').eq('category', cat).gte('created_at', sevenDaysAgo),
        ])
        return { category: cat, views: viewsRes.count || 0, saves: savesRes.count || 0, clicks: clicksRes.count || 0 }
      })
    ).then(setCategoryPerf)

    fetch('/api/admin/validation')
      .then(res => res.json())
      .then(body => { if (body.success) setValidation(body.data) })
      .catch(() => {})

    fetch('/api/admin/search-quality')
      .then(res => res.json())
      .then(body => { if (body.success) setSearchQuality(body.results || []) })
      .catch(() => {})
  }, [])

  const runFullPipeline = async () => {
    setRunningPipeline(true)
    setPipelineResults([])
    try {
      const res = await fetch('/api/agents/pipeline', { method: 'POST' })
      const body = await res.json()
      setPipelineResults(body.results || [])
    } catch (error) {
      setPipelineResults([{ agent_name: 'pipeline', action: 'run', status: 'failed', message: error instanceof Error ? error.message : 'Pipeline failed' }])
    } finally {
      setRunningPipeline(false)
    }
  }

  const runBrokenLinkAudit = async () => {
    setRunningQualityAudit(true)
    try {
      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: 'quality_control', action: 'check-links' }),
      })
      const body = await res.json()
      if (body.success) {
        setValidation((prev: any) => ({ ...prev, broken_link_audit: body.message }))
      }
    } catch {
      setValidation((prev: any) => ({ ...prev, broken_link_audit: 'Audit failed' }))
    } finally {
      setRunningQualityAudit(false)
    }
  }

  const runWhatsAppValidation = async () => {
    setRunningWhatsappTests(true)
    try {
      const examples = [
        'scholarship germany',
        'jobs canada',
        'grants ngo',
      ]
      const results = await Promise.all(examples.map(async (text) => {
        const res = await fetch('/api/whatsapp/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: 'whatsapp:+1234567890', text }),
        })
        const body = await res.json()
        return { text, success: body.success, response: body.response || body.message }
      }))
      setWhatsappResults(results)
    } catch {
      setWhatsappResults([{ text: 'validation', success: false, response: 'WhatsApp validation failed' }])
    } finally {
      setRunningWhatsappTests(false)
    }
  }

  if (loading || !daily) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    )
  }

  const statCards = [
    { icon: Briefcase, label: 'Total Opportunities', value: daily.total_opportunities, color: 'blue', sub: `${daily.opportunities_today} today` },
    { icon: TrendingUp, label: 'Rankings Today', value: daily.rankings_today, color: 'purple', sub: 'AI-ranked' },
    { icon: Users, label: 'Active Users', value: daily.active_users, color: 'green', sub: `${daily.new_users_today} new today` },
    { icon: DollarSign, label: 'Revenue MTD', value: `$${daily.revenue_mtd.toFixed(2)}`, color: 'amber', sub: `$${daily.revenue_today.toFixed(2)} today` },
    { icon: Heart, label: 'Saved', value: daily.total_saved, color: 'red', sub: 'total saves' },
    { icon: FileText, label: 'Applications', value: daily.total_applications, color: 'indigo', sub: 'total applications' },
    { icon: Star, label: 'Conversion Rate', value: `${daily.conversion_rate}%`, color: 'green', sub: `${daily.premium_users} premium users` },
    { icon: Activity, label: 'Agent Health', value: `${daily.active_agents} running`, color: daily.agent_errors > 0 ? 'red' : 'green', sub: `${daily.agent_errors} errors` },
    { icon: Shield, label: 'Source Health', value: `${daily.source_health.healthy} healthy`, color: daily.source_health.dead > 0 ? 'amber' : 'green', sub: `${daily.source_health.degraded} degraded, ${daily.source_health.dead} dead` },
    { icon: Zap, label: 'Digests Today', value: daily.daily_digests, color: 'amber', sub: 'daily digests' },
    { icon: Share2, label: 'Referrals', value: daily.referral_count, color: 'purple', sub: 'total referrals' },
    { icon: Clock, label: 'DAU / WAU / MAU', value: `${daily.dau} / ${daily.wau} / ${daily.mau}`, color: 'blue', sub: 'daily / weekly / monthly' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-500" />
            AI CEO Executive Dashboard
          </h1>
          <p className="text-gray-600">Real-time platform intelligence | {new Date().toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full ${daily.agent_errors === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {daily.agent_errors === 0 ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
            {daily.agent_errors === 0 ? 'System Healthy' : 'Attention Needed'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon
          const bgColorMap: Record<string, string> = {
            blue: 'bg-blue-100 text-blue-600',
            green: 'bg-green-100 text-green-600',
            amber: 'bg-amber-100 text-amber-600',
            red: 'bg-red-100 text-red-600',
            purple: 'bg-purple-100 text-purple-600',
            indigo: 'bg-indigo-100 text-indigo-600',
          }
          return (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgColorMap[card.color] || 'bg-gray-100'}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{card.value}</p>
                    <p className="text-sm text-gray-500">{card.label}</p>
                    <p className="text-xs text-gray-400">{card.sub}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Opportunities by Category
            </h3>
            <div className="space-y-3">
              {Object.entries(daily.opportunities_by_category).map(([cat, count]) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-32 capitalize truncate">{cat.replace(/_/g, ' ')}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${(count as number / Math.max(daily.total_opportunities, 1)) * 100}%` }} />
                  </div>
                  <span className="text-sm text-gray-500 w-12 text-right font-mono">{count as number}</span>
                </div>
              ))}
              {Object.keys(daily.opportunities_by_category).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Category Performance (7 days)
            </h3>
            <div className="space-y-4">
              {categoryPerf.map((cat: any) => {
                const total = cat.views + cat.saves + cat.clicks || 1
                const maxTotal = Math.max(...categoryPerf.map((c: any) => c.views + c.saves + c.clicks), 1)
                return (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize font-medium">{cat.category.replace(/_/g, ' ')}</span>
                      <span className="text-gray-500">{cat.views}v / {cat.saves}s / {cat.clicks}c</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(total / maxTotal) * 100}%` }} />
                    </div>
                  </div>
                )
              })}
              {categoryPerf.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No engagement data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Recent Agent Activity
            </h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {recentTasks.slice(0, 10).map((task: any) => (
                <div key={task.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Bot className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{task.agent_name.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-gray-400 truncate">→ {task.action}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      task.status === 'completed' ? 'bg-green-100 text-green-700' :
                      task.status === 'failed' ? 'bg-red-100 text-red-700' :
                      task.status === 'running' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {task.status}
                    </span>
                    <span className="text-xs text-gray-400">{new Date(task.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
              {recentTasks.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No recent agent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {validation && (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">Data Validation Dashboard</h3>
                <p className="text-sm text-gray-500">Live collection, quality and source health metrics for real-world validation.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={runFullPipeline} className="rounded-xl bg-amber-500 px-4 py-2 text-white hover:bg-amber-600 transition-colors disabled:opacity-50" disabled={runningPipeline}>
                  {runningPipeline ? 'Running pipeline…' : 'Run full pipeline'}
                </button>
                <button onClick={runBrokenLinkAudit} className="rounded-xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 transition-colors disabled:opacity-50" disabled={runningQualityAudit}>
                  {runningQualityAudit ? 'Running quality audit…' : 'Run broken link audit'}
                </button>
                <button onClick={runWhatsAppValidation} className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors disabled:opacity-50" disabled={runningWhatsappTests}>
                  {runningWhatsappTests ? 'Testing WhatsApp…' : 'Run WhatsApp validation'}
                </button>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              <div className="grid gap-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Opportunity Collection</p>
                  <p className="mt-4 text-3xl font-semibold text-slate-900">{validation.total_opportunities}</p>
                  <p className="text-sm text-slate-600">Collected today: {validation.opportunities_today}</p>
                  <p className="text-sm text-slate-600">Collected this week: {validation.opportunities_this_week}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Quality</p>
                  <p className="mt-4 text-3xl font-semibold text-slate-900">{validation.duplicate_rate}%</p>
                  <p className="text-sm text-slate-600">Duplicate rate</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">{validation.expired_rate}%</p>
                  <p className="text-sm text-slate-600">Expired opportunity rate</p>
                  <p className="mt-3 text-sm text-slate-600 text-amber-700">{validation.broken_link_audit || 'Broken link audit not run yet'}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Waitlist</p>
                  <p className="mt-4 text-3xl font-semibold text-slate-900">{validation.beta_waitlist_count}</p>
                  <p className="text-sm text-slate-600">Beta signups</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h4 className="font-semibold mb-4">Opportunities by Country</h4>
                <div className="space-y-3 max-h-72 overflow-y-auto">
                  {(
                    Object.entries(validation.opportunities_by_country || {}) as [string, number][]
                  ).slice(0, 12).map(([country, count]) => (
                    <div key={country} className="flex items-center justify-between text-sm text-slate-700">
                      <span className="truncate">{country || 'Unknown'}</span>
                      <span className="font-semibold text-slate-900">{count}</span>
                    </div>
                  ))}
                  {Object.keys(validation.opportunities_by_country || {}).length === 0 && (
                    <p className="text-sm text-slate-400">No country breakdown available</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h4 className="font-semibold mb-4">Top / Worst Sources</h4>
                <div className="grid gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Top sources</p>
                    {validation.top_sources?.slice(0, 5).map((source: any) => (
                      <div key={source.id} className="mt-3 text-sm text-slate-700">
                        <p className="font-medium truncate">{source.name}</p>
                        <p className="text-xs text-slate-500">Success {source.collection_success_rate}% · Errors {source.error_count}</p>
                      </div>
                    ))}
                    {!validation.top_sources?.length && <p className="text-sm text-slate-400">No source data</p>}
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Worst sources</p>
                    {validation.worst_sources?.slice(0, 5).map((source: any) => (
                      <div key={source.id} className="mt-3 text-sm text-slate-700">
                        <p className="font-medium truncate">{source.name}</p>
                        <p className="text-xs text-slate-500">Success {source.collection_success_rate}% · Errors {source.error_count}</p>
                      </div>
                    ))}
                    {!validation.worst_sources?.length && <p className="text-sm text-slate-400">No source data</p>}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {searchQuality.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">Search Quality Tests</h3>
                <p className="text-sm text-gray-500">Measure relevance, speed, and quality for sample search queries.</p>
              </div>
            </div>
            <div className="space-y-4">
              {searchQuality.map((test: any) => (
                <div key={test.label} className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium text-slate-900">{test.label}</p>
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-500">{test.duration_ms}ms</span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-4 text-sm text-slate-700">
                    <div><span className="font-semibold text-slate-900">{test.count}</span><br />results</div>
                    <div><span className="font-semibold text-slate-900">{test.avg_ranking_score}</span><br />avg rank</div>
                    <div><span className="font-semibold text-slate-900">{test.avg_quality_score}</span><br />avg quality</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {whatsappResults.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">WhatsApp Validation</h3>
            <div className="space-y-4">
              {whatsappResults.map((result: any) => (
                <div key={result.text} className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                  <p className="font-medium text-slate-900">"{result.text}"</p>
                  <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{result.response}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {pipelineResults.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Pipeline Execution Results</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {pipelineResults.map((item: any, index: number) => (
                <div key={index} className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                  <p className="text-sm font-medium text-slate-900">{item.agent_name} · {item.action}</p>
                  <p className="text-sm text-slate-600">{item.message || item.result || ''}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {metrics && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Success Metrics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{metrics.dau}</p>
                <p className="text-xs text-blue-800 font-medium">Daily Active Users</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{metrics.wau}</p>
                <p className="text-xs text-green-800 font-medium">Weekly Active Users</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{metrics.mau}</p>
                <p className="text-xs text-purple-800 font-medium">Monthly Active Users</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <p className="text-2xl font-bold text-amber-600">{metrics.conversion_rate}%</p>
                <p className="text-xs text-amber-800 font-medium">Conversion Rate</p>
              </div>
              <div className="text-center p-3 bg-indigo-50 rounded-lg">
                <p className="text-2xl font-bold text-indigo-600">{daily.referral_count}</p>
                <p className="text-xs text-indigo-800 font-medium">Referral Growth</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">${daily.revenue_mtd.toFixed(0)}</p>
                <p className="text-xs text-red-800 font-medium">Premium Revenue</p>
              </div>
              <div className="text-center p-3 bg-teal-50 rounded-lg">
                <p className="text-2xl font-bold text-teal-600">{metrics.total_users}</p>
                <p className="text-xs text-teal-800 font-medium">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
