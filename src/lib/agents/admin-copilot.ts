import { BaseAgent, type AgentResult } from './base-agent'

export class AdminCopilotAgent extends BaseAgent {
  constructor() {
    super('admin_copilot', 2)
  }

  async execute(action: string, _payload?: Record<string, unknown>): Promise<AgentResult> {
    switch (action) {
      case 'daily-report':
        return this.generateDailyReport()
      case 'growth-report':
        return this.generateGrowthReport()
      case 'error-report':
        return this.generateErrorReport()
      case 'executive-summary':
        return this.generateExecutiveSummary()
      case 'source-health':
        return this.generateSourceHealth()
      case 'revenue-report':
        return this.generateRevenueReport()
      default:
        return { success: false, message: `Unknown action: ${action}` }
    }
  }

  private async generateDailyReport(): Promise<AgentResult> {
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString()

    const [
      totalOpps, newToday, activeUsers, newUsersToday,
      pendingTasks, failedTasks, runningTasks, revenue,
      savedCount, appCount, sourceHealth,
    ] = await Promise.all([
      this.supabase.from('opportunities').select('id', { count: 'exact', head: true }),
      this.supabase.from('opportunities').select('id', { count: 'exact', head: true }).gte('created_at', today),
      this.supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
      this.supabase.from('user_profiles').select('id', { count: 'exact', head: true }).gte('created_at', today),
      this.supabase.from('agent_tasks').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      this.supabase.from('agent_tasks').select('id', { count: 'exact', head: true }).eq('status', 'failed').gte('created_at', yesterday),
      this.supabase.from('agent_tasks').select('id', { count: 'exact', head: true }).eq('status', 'running'),
      this.supabase.from('revenue_events').select('amount').gte('created_at', today),
      this.supabase.from('user_matches').select('id', { count: 'exact', head: true }).eq('is_saved', true),
      this.supabase.from('user_matches').select('id', { count: 'exact', head: true }).eq('is_applied', true),
      this.supabase.from('source_health').select('status'),
    ])

    const todayRevenue = (revenue.data || []).reduce((sum: number, e: any) => sum + Number(e.amount), 0)

    let healthy = 0; let degraded = 0; let dead = 0
    for (const sh of (sourceHealth.data || [])) {
      if (sh.status === 'healthy') healthy++
      else if (sh.status === 'degraded') degraded++
      else if (sh.status === 'dead') dead++
    }

    const report = {
      type: 'daily',
      date: today,
      opportunities: {
        total: totalOpps.count || 0,
        new_today: newToday.count || 0,
      },
      users: {
        total: activeUsers.count || 0,
        new_today: newUsersToday.count || 0,
      },
      agents: {
        pending: pendingTasks.count || 0,
        running: runningTasks.count || 0,
        failed_24h: failedTasks.count || 0,
      },
      engagement: {
        saved: savedCount.count || 0,
        applications: appCount.count || 0,
      },
      revenue_today: todayRevenue,
      source_health: { healthy, degraded, dead },
      system_health: (failedTasks.count || 0) === 0 ? 'healthy' : 'attention_needed',
      generated_at: new Date().toISOString(),
    }

    return { success: true, message: 'Daily report generated', data: report }
  }

  private async generateGrowthReport(): Promise<AgentResult> {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString()

    const [usersTotal, usersWeek, usersMonth, oppsTotal, oppsWeek, oppsMonth, matchesTotal, matchesWeek] = await Promise.all([
      this.supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
      this.supabase.from('user_profiles').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
      this.supabase.from('user_profiles').select('id', { count: 'exact', head: true }).gte('created_at', monthAgo),
      this.supabase.from('opportunities').select('id', { count: 'exact', head: true }).in('status', ['approved', 'featured']),
      this.supabase.from('opportunities').select('id', { count: 'exact', head: true }).in('status', ['approved', 'featured']).gte('created_at', weekAgo),
      this.supabase.from('opportunities').select('id', { count: 'exact', head: true }).in('status', ['approved', 'featured']).gte('created_at', monthAgo),
      this.supabase.from('user_matches').select('id', { count: 'exact', head: true }),
      this.supabase.from('user_matches').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
    ])

    const report = {
      type: 'growth',
      period: {
        weekly: weekAgo,
        monthly: monthAgo,
      },
      users: {
        total: usersTotal.count || 0,
        new_this_week: usersWeek.count || 0,
        new_this_month: usersMonth.count || 0,
        weekly_growth_pct: usersTotal.count ? Math.round((usersWeek.count || 0) / usersTotal.count * 100) : 0,
        monthly_growth_pct: usersTotal.count ? Math.round((usersMonth.count || 0) / usersTotal.count * 100) : 0,
      },
      opportunities: {
        total_approved: oppsTotal.count || 0,
        new_this_week: oppsWeek.count || 0,
        new_this_month: oppsMonth.count || 0,
        weekly_growth_pct: oppsTotal.count ? Math.round((oppsWeek.count || 0) / oppsTotal.count * 100) : 0,
        monthly_growth_pct: oppsTotal.count ? Math.round((oppsMonth.count || 0) / oppsTotal.count * 100) : 0,
      },
      matches: {
        total: matchesTotal.count || 0,
        this_week: matchesWeek.count || 0,
      },
      generated_at: new Date().toISOString(),
    }

    return { success: true, message: 'Growth report generated', data: report }
  }

  private async generateErrorReport(): Promise<AgentResult> {
    const { data: failedTasks } = await this.supabase
      .from('agent_tasks')
      .select('agent_name, error, created_at')
      .eq('status', 'failed')
      .order('created_at', { ascending: false })
      .limit(20)

    const errorsByAgent: Record<string, number> = {}
    for (const task of (failedTasks || []) as any[]) {
      errorsByAgent[task.agent_name] = (errorsByAgent[task.agent_name] || 0) + 1
    }

    const { data: recentErrors } = await this.supabase
      .from('agent_tasks')
      .select('agent_name, error, action, created_at')
      .eq('status', 'failed')
      .order('created_at', { ascending: false })
      .limit(10)

    const report = {
      type: 'errors',
      total_failed_last_24h: failedTasks?.length || 0,
      errors_by_agent: errorsByAgent,
      recent_errors: (recentErrors || []).map((t: any) => ({
        agent: t.agent_name,
        action: t.action,
        error: t.error?.slice(0, 200),
        time: t.created_at,
      })),
      generated_at: new Date().toISOString(),
    }

    return { success: true, message: 'Error report generated', data: report }
  }

  private async generateExecutiveSummary(): Promise<AgentResult> {
    const [daily, growth, errors, revenue] = await Promise.all([
      this.generateDailyReport(),
      this.generateGrowthReport(),
      this.generateErrorReport(),
      this.generateRevenueReport(),
    ])

    return {
      success: true,
      message: 'Executive summary generated',
      data: {
        daily: daily.data,
        growth: growth.data,
        errors: errors.data,
        revenue: revenue.data,
        generated_at: new Date().toISOString(),
      },
    }
  }

  private async generateSourceHealth(): Promise<AgentResult> {
    const { data: health } = await this.supabase
      .from('source_health')
      .select('source_id, status, error_rate_24h, success_rate_24h, checked_at')
      .order('checked_at', { ascending: false })
      .limit(50)

    const byStatus: Record<string, number> = { healthy: 0, degraded: 0, dead: 0 }
    for (const h of (health || []) as any[]) {
      byStatus[h.status] = (byStatus[h.status] || 0) + 1
    }

    return {
      success: true,
      message: 'Source health summary',
      data: {
        total_sources: health?.length || 0,
        by_status: byStatus,
        last_checked: health?.[0]?.checked_at || null,
      },
    }
  }

  private async generateRevenueReport(): Promise<AgentResult> {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const [monthlyEvents, activeSubs, byPlan] = await Promise.all([
      this.supabase.from('revenue_events').select('amount, plan_tier, event_type').gte('created_at', monthStart),
      this.supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      this.supabase.from('subscriptions').select('plan, count:plan', { count: 'exact' }).eq('status', 'active'),
    ])

    const totalRevenue = (monthlyEvents.data || []).reduce((sum: number, e: any) => sum + Number(e.amount), 0)
    const byPlanBreakdown: Record<string, number> = {}
    for (const p of (byPlan.data || []) as any[]) {
      byPlanBreakdown[p.plan] = p.count
    }

    const byEventType: Record<string, number> = {}
    for (const e of (monthlyEvents.data || []) as any[]) {
      byEventType[e.event_type] = (byEventType[e.event_type] || 0) + Number(e.amount)
    }

    const report = {
      type: 'revenue',
      period: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
      total_revenue_mtd: totalRevenue,
      active_subscriptions: activeSubs.count || 0,
      subscriptions_by_plan: byPlanBreakdown,
      revenue_by_type: byEventType,
      mrr: Math.round(totalRevenue),
      arpu: activeSubs.count ? Math.round(totalRevenue / activeSubs.count * 100) / 100 : 0,
      generated_at: new Date().toISOString(),
    }

    return { success: true, message: 'Revenue report generated', data: report }
  }
}
