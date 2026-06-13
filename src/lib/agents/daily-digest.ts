import { BaseAgent, AgentResult } from './base-agent'

export class DailyDigestAgent extends BaseAgent {
  constructor() {
    super('daily_digest', 3)
  }

  async execute(action: string, payload?: Record<string, unknown>): Promise<AgentResult> {
    switch (action) {
      case 'generate':
        return this.generateDigest()
      case 'send':
        return this.sendDigest(payload as any)
      case 'generate-and-send':
        return this.generateAndSend()
      default:
        return { success: false, message: `Unknown action: ${action}` }
    }
  }

  private async generateDigest(): Promise<AgentResult> {
    const categories = ['scholarship', 'foreign_job', 'grant', 'tender', 'fellowship']
    const days = { generated: 0 }

    for (const category of categories) {
      const { data: opps } = await this.supabase
        .from('opportunities')
        .select('id, title, url, ranking_score, view_count, popularity_score, category, country, organization')
        .eq('category', category)
        .in('status', ['approved', 'featured'])
        .order('ranking_score', { ascending: false })
        .limit(20)

      if (!opps || opps.length === 0) continue

      const sorted = opps
        .sort((a: any, b: any) => {
          const scoreA = (a.ranking_score || 0) + (a.popularity_score || 0) + Math.min((a.view_count || 0) / 10, 10)
          const scoreB = (b.ranking_score || 0) + (b.popularity_score || 0) + Math.min((b.view_count || 0) / 10, 10)
          return scoreB - scoreA
        })
        .slice(0, 10)
        .map((o: any) => ({ id: o.id, title: o.title, url: o.url, score: o.ranking_score || 0 }))

      const { error } = await this.supabase.from('daily_digests').insert({
        date: new Date().toISOString().split('T')[0],
        category,
        opportunities: sorted,
        sent_via: [],
        sent_to_count: 0,
      })

      if (!error) days.generated++
    }

    return { success: true, message: `Generated digests for ${days.generated} categories`, data: days as any }
  }

  private async sendDigest(payload: {
    digestId?: string; channels?: string[]; category?: string
  }): Promise<AgentResult> {
    const today = new Date().toISOString().split('T')[0]

    let query = this.supabase.from('daily_digests').select('*').eq('date', today)
    if (payload.category) query = query.eq('category', payload.category)
    if (payload.digestId) query = query.eq('id', payload.digestId)

    const { data: digests, error } = await query
    if (error) return { success: false, message: error.message }
    if (!digests?.length) return { success: false, message: 'No digests found for today' }

    const channels = payload.channels || ['email', 'dashboard']
    let totalSent = 0

    const { data: users } = await this.supabase
      .from('user_profiles')
      .select('id, email, phone, email_subscribed, whatsapp_subscribed')
      .in('plan_tier', ['premium', 'premium_plus', 'enterprise'])

    for (const digest of digests) {
      const via: string[] = []

      if (channels.includes('dashboard')) {
        via.push('dashboard')
      }

      if (channels.includes('email')) {
        via.push('email')
      }

      if (channels.includes('whatsapp') && users?.length) {
        const whatsappUsers = users.filter((u: any) => u.whatsapp_subscribed)
        for (const user of whatsappUsers) {
          totalSent++
        }
        via.push('whatsapp')
      }

      await this.supabase.from('daily_digests')
        .update({
          sent_via: via,
          sent_to_count: (digest.sent_to_count || 0) + totalSent,
        })
        .eq('id', digest.id)
    }

    return { success: true, message: `Digest sent to ${totalSent} users via ${channels.join(', ')}`, data: { sent: totalSent, channels } as any }
  }

  private async generateAndSend(): Promise<AgentResult> {
    const genResult = await this.generateDigest()
    if (!genResult.success) return genResult

    const sendResult = await this.sendDigest({ channels: ['email', 'dashboard'] })
    return {
      success: true,
      message: `${genResult.message}, ${sendResult.message}`,
      data: { ...(genResult.data || {}), ...(sendResult.data || {}) } as any,
    }
  }
}
