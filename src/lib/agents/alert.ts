import { BaseAgent, type AgentResult } from './base-agent'
import { sendResendEmail } from '@/lib/email/resend'
import { hasWhatsAppConfig, sendWhatsAppMessage } from '@/lib/whatsapp/client'

export class AlertAgent extends BaseAgent {
  constructor() {
    super('alert', 3)
  }

  async execute(action: string, _payload?: Record<string, unknown>): Promise<AgentResult> {
    switch (action) {
      case 'daily-digest':
        return this.sendDailyDigest()
      case 'instant-alerts':
        return this.sendInstantAlerts()
      case 'weekly-summary':
        return this.sendWeeklySummary()
      default:
        return { success: false, message: `Unknown action: ${action}` }
    }
  }

  private async sendDailyDigest(): Promise<AgentResult> {
    const { data: users } = await this.supabase
      .from('user_profiles')
      .select('id, email, phone, whatsapp_subscribed, email_subscribed')
      .or('whatsapp_subscribed.eq.true,email_subscribed.eq.true')

    if (!users?.length) return { success: true, message: 'No subscribed users' }

    let sent = 0
    for (const user of users) {
      const { data: matches } = await this.supabase
        .from('user_matches')
        .select('opportunity_id, match_score')
        .eq('user_id', user.id)
        .eq('is_viewed', false)
        .order('match_score', { ascending: false })
        .limit(5)

      if (!matches?.length) continue

      const matchIds = matches.map((m: any) => m.opportunity_id)
      const { data: opportunities } = await this.supabase
        .from('opportunities')
        .select('id, title, category, deadline')
        .in('id', matchIds)

      if (!opportunities?.length) continue

      const digest = this.buildDigestMessage(opportunities, matches)

      if (user.email_subscribed && user.email) {
        await this.sendEmail(user.email, 'Your Daily Opportunity Digest', digest)
      }
      if (user.whatsapp_subscribed && user.phone) {
        await this.sendWhatsApp(user.phone, digest)
      }

      await this.createNotifications(user.id, opportunities, 'daily_digest')
      sent++
    }

    return { success: true, message: `Sent daily digest to ${sent} users` }
  }

  private async sendInstantAlerts(): Promise<AgentResult> {
    const { data: newOpportunities } = await this.supabase
      .from('opportunities')
      .select('id, title, category, country, quality_score')
      .eq('status', 'approved')
      .gte('quality_score', 70)
      .order('created_at', { ascending: false })
      .limit(20)

    if (!newOpportunities?.length) return { success: true, message: 'No high-quality new opportunities' }

    const { data: users } = await this.supabase
      .from('user_profiles')
      .select('id')
      .eq('is_onboarded', true)

    if (!users?.length) return { success: true, message: 'No users to notify' }

    let alerts = 0
    for (const user of users) {
      for (const opp of newOpportunities) {
        const { data: existingMatch } = await this.supabase
          .from('user_matches')
          .select('id')
          .eq('user_id', user.id)
          .eq('opportunity_id', opp.id)
          .single()

        if (!existingMatch) {
          await this.createNotification(user.id, {
            title: `New ${opp.category.replace('_', ' ')}: ${opp.title}`,
            body: `A new opportunity in ${opp.country || 'various locations'} is now available.`,
            channel: 'push',
          })
          alerts++
        }
      }
    }

    return { success: true, message: `Sent ${alerts} instant alerts` }
  }

  private async sendWeeklySummary(): Promise<AgentResult> {
    const { data: users } = await this.supabase
      .from('user_profiles')
      .select('id, email')
      .eq('email_subscribed', true)

    if (!users?.length) return { success: true, message: 'No subscribed users' }

    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()

    const { data: weeklyData } = await this.supabase
      .from('opportunities')
      .select('category, count:category', { count: 'exact' })
      .gte('created_at', weekAgo)
      .order('category')

    let sent = 0
    for (const user of users) {
      const { data: userMatches } = await this.supabase
        .from('user_matches')
        .select('opportunity_id, match_score')
        .eq('user_id', user.id)
        .gte('created_at', weekAgo)
        .order('match_score', { ascending: false })
        .limit(10)

      const summary = this.buildWeeklySummary(weeklyData || [], userMatches || [])
      await this.sendEmail(user.email, 'Your Weekly Fursa AI Summary', summary)
      sent++
    }

    return { success: true, message: `Sent weekly summary to ${sent} users` }
  }

  private buildDigestMessage(opportunities: { id: string; title: string; category: string; deadline?: string | null }[],
                             matches: { opportunity_id: string; match_score: number }[]): string {
    let msg = '🔔 *Your Daily Opportunity Digest*\n\n'
    for (const opp of opportunities) {
      const match = matches.find(m => m.opportunity_id === opp.id)
      msg += `• *${opp.title}*\n  Category: ${opp.category} | Match: ${match?.match_score || 'N/A'}%\n  Deadline: ${opp.deadline ? new Date(opp.deadline).toLocaleDateString() : 'Open'}\n\n`
    }
    msg += 'View all at: https://fursaai.com/dashboard'
    return msg
  }

  private buildWeeklySummary(weeklyData: { category: string; count: number }[],
                             userMatches: { opportunity_id: string; match_score: number }[]): string {
    let msg = '📊 *Your Weekly Fursa AI Summary*\n\n'
    msg += 'New opportunities this week:\n'
    for (const d of weeklyData) {
      msg += `• ${d.category}: ${d.count}\n`
    }
    msg += `\nYour top matches: ${userMatches.length}\n`
    msg += '\nhttps://fursaai.com/dashboard'
    return msg
  }

  private async sendEmail(to: string, subject: string, body: string): Promise<void> {
    await this.log(`Sending email to ${to}: ${subject}`)
    try {
      await sendResendEmail({
        to,
        subject,
        html: `<pre>${body.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>')}</pre>`,
        text: body,
      })
    } catch (error) {
      await this.log(`Email send failed for ${to}: ${error instanceof Error ? error.message : 'unknown error'}`)
    }
  }

  private async sendWhatsApp(phone: string, message: string): Promise<void> {
    await this.log(`Sending WhatsApp to ${phone}`)
    if (!hasWhatsAppConfig()) {
      await this.log('WhatsApp is not configured; skipping outbound message')
      return
    }

    try {
      await sendWhatsAppMessage(phone, message)
    } catch (error) {
      await this.log(`WhatsApp send failed for ${phone}: ${error instanceof Error ? error.message : 'unknown error'}`)
    }
  }

  private async createNotifications(userId: string, opportunities: { id: string; title: string }[], type: string): Promise<void> {
    for (const opp of opportunities) {
      await this.createNotification(userId, {
        title: `New match: ${opp.title}`,
        body: `A new opportunity matched your profile.`,
        channel: type === 'daily_digest' ? 'email' : 'push',
      })
    }
  }

  private async createNotification(userId: string, notification: { title: string; body: string; channel: string }): Promise<void> {
    await this.supabase.from('notifications').insert({
      user_id: userId,
      title: notification.title,
      body: notification.body,
      channel: notification.channel,
    })
  }
}
