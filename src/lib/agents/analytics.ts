import { BaseAgent, AgentResult } from './base-agent'
import type { CategoryPerformance, SuccessMetrics } from '@/types'

export class AnalyticsAgent extends BaseAgent {
  constructor() {
    super('analytics', 3)
  }

  async execute(action: string, payload?: Record<string, unknown>): Promise<AgentResult> {
    switch (action) {
      case 'track-event':
        return this.trackEvent(payload as any)
      case 'log-search':
        return this.logSearch(payload as any)
      case 'category-performance':
        return this.getCategoryPerformance()
      case 'success-metrics':
        return this.getSuccessMetrics()
      case 'daily-report':
        return this.generateDailyReport()
      case 'top-keywords':
        return this.getTopKeywords()
      default:
        return { success: false, message: `Unknown action: ${action}` }
    }
  }

  private async trackEvent(event: {
    user_id?: string; session_id?: string; event_type: string;
    opportunity_id?: string; category?: string; country?: string; metadata?: Record<string, unknown>
  }): Promise<AgentResult> {
    const { error } = await this.supabase.from('analytics_events').insert({
      user_id: event.user_id || null,
      session_id: event.session_id || null,
      event_type: event.event_type,
      opportunity_id: event.opportunity_id || null,
      category: event.category || null,
      country: event.country || null,
      metadata: event.metadata || {},
    })

    if (error) return { success: false, message: `Failed to track event: ${error.message}` }

    if (event.event_type === 'save' && event.opportunity_id) {
      await this.supabase.rpc('increment_opportunity_save_count', { opp_id: event.opportunity_id })
    }
    if (event.event_type === 'click' && event.opportunity_id) {
      await this.supabase.from('opportunities').update({ click_count: this.supabase.rpc('increment', { x: 1 }) }).eq('id', event.opportunity_id)
    }

    return { success: true, message: 'Event tracked' }
  }

  private async logSearch(data: {
    user_id?: string; query: string; category?: string;
    country?: string; result_count?: number; filters?: Record<string, unknown>
  }): Promise<AgentResult> {
    const { error } = await this.supabase.from('search_logs').insert({
      user_id: data.user_id || null,
      query: data.query,
      category: data.category || null,
      country: data.country || null,
      result_count: data.result_count || 0,
      filters: data.filters || {},
    })

    if (error) return { success: false, message: `Failed to log search: ${error.message}` }
    return { success: true, message: 'Search logged' }
  }

  private async getCategoryPerformance(): Promise<AgentResult> {
    const categories = ['scholarship', 'foreign_job', 'grant', 'tender', 'fellowship', 'startup_funding', 'competition', 'internship', 'exchange_program']

    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()

    const performance: CategoryPerformance[] = []

    for (const category of categories) {
      const [viewsRes, savesRes, clicksRes, appsRes, alertsRes, revenueRes] = await Promise.all([
        this.supabase.from('analytics_events').select('id', { count: 'exact', head: true })
          .eq('event_type', 'view').eq('category', category).gte('created_at', sevenDaysAgo),
        this.supabase.from('analytics_events').select('id', { count: 'exact', head: true })
          .eq('event_type', 'save').eq('category', category).gte('created_at', sevenDaysAgo),
        this.supabase.from('analytics_events').select('id', { count: 'exact', head: true })
          .eq('event_type', 'click').eq('category', category).gte('created_at', sevenDaysAgo),
        this.supabase.from('opportunities').select('id', { count: 'exact', head: true })
          .eq('category', category).gte('application_count', 1).gte('created_at', thirtyDaysAgo),
        this.supabase.from('analytics_events').select('id', { count: 'exact', head: true })
          .eq('event_type', 'alert_open').eq('category', category).gte('created_at', sevenDaysAgo),
        this.supabase.from('subscriptions').select('id', { count: 'exact', head: true })
          .eq('plan', 'premium').gte('created_at', thirtyDaysAgo),
      ])

      const views = viewsRes.count || 0
      const saves = savesRes.count || 0
      const clicks = clicksRes.count || 0
      const applications = appsRes.count || 0
      const alertsOpened = alertsRes.count || 0

      const prevViewsRes = await this.supabase.from('analytics_events').select('id', { count: 'exact', head: true })
        .eq('event_type', 'view').eq('category', category)
        .gte('created_at', new Date(Date.now() - 14 * 86400000).toISOString())
        .lt('created_at', sevenDaysAgo)

      const prevSavesRes = await this.supabase.from('analytics_events').select('id', { count: 'exact', head: true })
        .eq('event_type', 'save').eq('category', category)
        .gte('created_at', new Date(Date.now() - 14 * 86400000).toISOString())
        .lt('created_at', sevenDaysAgo)

      const prevViews = prevViewsRes.count || 1
      const prevSaves = prevSavesRes.count || 1

      performance.push({
        category: category as any,
        views,
        saves,
        clicks,
        applications,
        alerts_opened: alertsOpened,
        premium_conversions: revenueRes.count || 0,
        revenue: (revenueRes.count || 0) * 9.99,
        revenue_trend: 0,
        views_trend: Math.round(((views - prevViews) / prevViews) * 100),
        saves_trend: Math.round(((saves - prevSaves) / prevSaves) * 100),
      })
    }

    return { success: true, message: 'Category performance computed', data: { performance } as any }
  }

  private async getSuccessMetrics(): Promise<AgentResult> {
    const now = new Date()
    const todayStart = now.toISOString().split('T')[0]
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString()
    const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString()

    const [dauRes, wauRes, mauRes, totalUsers, premiumUsers, revenueRes, referralsRes] = await Promise.all([
      this.supabase.from('analytics_events').select('user_id', { count: 'exact', head: true })
        .gte('created_at', todayStart).not('user_id', 'is', null),
      this.supabase.from('analytics_events').select('user_id', { count: 'exact', head: true })
        .gte('created_at', weekAgo).not('user_id', 'is', null),
      this.supabase.from('analytics_events').select('user_id', { count: 'exact', head: true })
        .gte('created_at', monthAgo).not('user_id', 'is', null),
      this.supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
      this.supabase.from('user_profiles').select('id', { count: 'exact', head: true })
        .in('plan_tier', ['premium', 'premium_plus', 'enterprise']),
      this.supabase.from('revenue_events').select('amount').gte('created_at', monthAgo),
      this.supabase.from('referrals').select('id', { count: 'exact', head: true })
        .gte('created_at', monthAgo).eq('status', 'converted'),
    ])

    const dau = dauRes.count || 0
    const wau = wauRes.count || 0
    const mau = mauRes.count || 0
    const total = totalUsers.count || 0
    const premium = premiumUsers.count || 0
    const premiumRevenue = (revenueRes.data || []).reduce((s: number, r: any) => s + Number(r.amount), 0)
    const referrals = referralsRes.count || 0

    const metrics: SuccessMetrics = {
      daily_active_users: dau,
      weekly_active_users: wau,
      monthly_active_users: mau,
      conversion_rate: total > 0 ? Math.round((premium / total) * 100) : 0,
      referral_growth: referrals,
      premium_revenue: premiumRevenue,
      opportunity_engagement: Math.round(((dau + wau + mau) / 3)),
      total_users: total,
      premium_users: premium,
      dau_wau_ratio: wau > 0 ? Math.round((dau / wau) * 100) : 0,
      wau_mau_ratio: mau > 0 ? Math.round((wau / mau) * 100) : 0,
    }

    return { success: true, message: 'Success metrics computed', data: metrics as any }
  }

  private async generateDailyReport(): Promise<AgentResult> {
    const perfResult = await this.getCategoryPerformance()
    const metricsResult = await this.getSuccessMetrics()

    const perf = perfResult.data as any
    const metrics = metricsResult.data as any

    const topCategory = perf?.performance?.length
      ? perf.performance.sort((a: any, b: any) => b.views - a.views)[0]
      : null

    return {
      success: true,
      message: 'Daily analytics report generated',
      data: {
        metrics,
        top_category: topCategory?.category || null,
        top_category_views: topCategory?.views || 0,
        report_date: new Date().toISOString().split('T')[0],
      } as any,
    }
  }

  private async getTopKeywords(limit = 20): Promise<AgentResult> {
    const { data, error } = await this.supabase
      .from('search_logs')
      .select('query, created_at')
      .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString())

    if (error) return { success: false, message: error.message }

    const freq: Record<string, number> = {}
    for (const row of data || []) {
      const q = (row.query || '').toLowerCase().trim()
      if (q) freq[q] = (freq[q] || 0) + 1
    }

    const top = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([query, count]) => ({ query, count }))

    return { success: true, message: 'Top keywords found', data: { keywords: top } as any }
  }
}
