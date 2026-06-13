import { BaseAgent, type AgentResult } from './base-agent'
import type { PlanTier } from '@/types'

const PLAN_PRICES: Record<PlanTier, number> = {
  free: 0,
  premium: 9.99,
  premium_plus: 19.99,
  enterprise: 49.99,
}

const PLAN_FEATURES: Record<PlanTier, string[]> = {
  free: ['Browse opportunities', 'Weekly digest', 'Basic search'],
  premium: ['Instant alerts', 'Match scoring', 'Saved opportunities', 'AI application assistant', 'Unlimited browsing', 'Priority support'],
  premium_plus: ['Everything in Premium', 'Unlimited AI document generation', 'Advanced matching', 'Priority alerts', 'ATS-optimized CV builder', 'Dedicated support'],
  enterprise: ['Everything in Premium Plus', 'API access', 'Custom integrations', 'Account manager', 'White-label options', 'SLA guarantee'],
}

export class RevenueAgent extends BaseAgent {
  constructor() {
    super('revenue', 2)
  }

  async execute(action: string, payload?: Record<string, unknown>): Promise<AgentResult> {
    switch (action) {
      case 'track':
        return this.trackRevenue()
      case 'sync-subscriptions':
        return this.syncSubscriptions()
      case 'usage-report':
        return this.usageReport()
      case 'plan-details':
        return this.getPlanDetails(payload?.plan as string)
      case 'upgrade-user':
        return this.upgradeUser(payload?.userId as string, payload?.plan as PlanTier)
      default:
        return { success: false, message: `Unknown action: ${action}` }
    }
  }

  private async trackRevenue(): Promise<AgentResult> {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const today = now.toISOString().split('T')[0]

    const [monthlyData, todayData, activeSubs] = await Promise.all([
      this.supabase.from('revenue_events').select('amount, plan_tier').gte('created_at', monthStart),
      this.supabase.from('revenue_events').select('amount').gte('created_at', today),
      this.supabase.from('subscriptions').select('id, user_id, plan', { count: 'exact', head: true }).eq('status', 'active'),
    ])

    const monthlyRevenue = (monthlyData.data || []).reduce((sum: number, e: any) => sum + Number(e.amount), 0)
    const todayRevenue = (todayData.data || []).reduce((sum: number, e: any) => sum + Number(e.amount), 0)

    const planBreakdown: Record<string, number> = {}
    for (const e of (monthlyData.data || [])) {
      if (e.plan_tier) {
        planBreakdown[e.plan_tier] = (planBreakdown[e.plan_tier] || 0) + Number(e.amount)
      }
    }

    return {
      success: true,
      message: `MTD: $${monthlyRevenue.toFixed(2)}, Today: $${todayRevenue.toFixed(2)}, Active Subs: ${activeSubs.count || 0}`,
      data: { monthly_revenue: monthlyRevenue, today_revenue: todayRevenue, active_subscriptions: activeSubs.count || 0, plan_breakdown: planBreakdown },
    }
  }

  private async syncSubscriptions(): Promise<AgentResult> {
    const { data: subscriptions } = await this.supabase
      .from('subscriptions')
      .select('id, user_id, plan, status, current_period_end')
      .neq('status', 'cancelled')

    if (!subscriptions?.length) return { success: true, message: 'No subscriptions to sync' }

    let expired = 0
    for (const sub of subscriptions) {
      if (sub.current_period_end && new Date(sub.current_period_end) < new Date()) {
        await this.supabase.from('subscriptions').update({ status: 'expired' }).eq('id', sub.id)
        await this.supabase.from('user_profiles').update({ role: 'user', plan_tier: 'free' }).eq('id', sub.user_id)

        await this.supabase.from('revenue_events').insert({
          user_id: sub.user_id,
          event_type: 'subscription_cancelled',
          amount: 0,
          currency: 'USD',
          plan_tier: sub.plan,
        }).maybeSingle()

        expired++
      }
    }

    return { success: true, message: `Synced subscriptions: ${expired} expired` }
  }

  private async usageReport(): Promise<AgentResult> {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const [subscriptions, matches, documents] = await Promise.all([
      this.supabase.from('subscriptions').select('plan, status'),
      this.supabase.from('user_matches').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
      this.supabase.from('generated_documents').select('id, type').gte('created_at', monthStart),
    ])

    const activeByPlan: Record<string, number> = {}
    for (const sub of (subscriptions.data || [])) {
      if (sub.status === 'active') {
        activeByPlan[sub.plan] = (activeByPlan[sub.plan] || 0) + 1
      }
    }

    const docTypes: Record<string, number> = {}
    for (const doc of (documents.data || [])) {
      docTypes[doc.type] = (docTypes[doc.type] || 0) + 1
    }

    return {
      success: true,
      message: 'Usage report generated',
      data: {
        active_by_plan: activeByPlan,
        total_subscriptions: subscriptions.data?.length || 0,
        matches_this_month: matches.count || 0,
        documents_this_month: documents.data?.length || 0,
        documents_by_type: docTypes,
      },
    }
  }

  private async getPlanDetails(plan?: string): Promise<AgentResult> {
    const tier = (plan as PlanTier) || 'free'
    const details = {
      tier,
      price: PLAN_PRICES[tier] || 0,
      features: PLAN_FEATURES[tier] || [],
      stripe_price_id: tier === 'premium'
        ? process.env.STRIPE_PREMIUM_PRICE_ID
        : tier === 'premium_plus'
        ? process.env.STRIPE_PREMIUM_PLUS_PRICE_ID
        : process.env.STRIPE_ENTERPRISE_PRICE_ID,
    }

    return { success: true, message: `${tier} plan details`, data: details }
  }

  private async upgradeUser(userId?: string, plan?: PlanTier): Promise<AgentResult> {
    if (!userId || !plan) return { success: false, message: 'Missing userId or plan' }

    const roleMap: Record<string, string> = {
      premium: 'premium',
      premium_plus: 'premium_plus',
      enterprise: 'enterprise',
    }

    await this.supabase
      .from('user_profiles')
      .update({ role: roleMap[plan] || 'user', plan_tier: plan })
      .eq('id', userId)

    await this.supabase
      .from('subscriptions')
      .upsert({ user_id: userId, plan, status: 'active' })

    return { success: true, message: `User ${userId} upgraded to ${plan}` }
  }
}
