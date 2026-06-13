import { BaseAgent, AgentResult } from './base-agent'
import { randomBytes } from 'crypto'

export class ReferralAgent extends BaseAgent {
  constructor() {
    super('referral', 3)
  }

  async execute(action: string, payload?: Record<string, unknown>): Promise<AgentResult> {
    switch (action) {
      case 'generate-code':
        return this.generateCode(payload?.userId as string)
      case 'track-invite':
        return this.trackInvite(payload as any)
      case 'process-conversion':
        return this.processConversion(payload?.inviteeId as string)
      case 'reward':
        return this.rewardReferrer(payload?.referralId as string)
      case 'stats':
        return this.getReferralStats(payload?.userId as string)
      default:
        return { success: false, message: `Unknown action: ${action}` }
    }
  }

  private generateCode(userId: string): Promise<AgentResult> {
    const code = `FURSA${randomBytes(3).toString('hex').toUpperCase()}`
    return this.supabase.from('user_profiles').update({ referral_code: code }).eq('id', userId)
      .then(() => ({ success: true, message: 'Referral code generated', data: { code } as any }))
      .catch((e: any) => ({ success: false, message: e.message }))
  }

  private async trackInvite(payload: {
    referrerId: string; inviteeEmail?: string; code: string
  }): Promise<AgentResult> {
    const { data: referrer } = await this.supabase.from('user_profiles')
      .select('id').eq('referral_code', payload.code).single()

    if (!referrer) return { success: false, message: 'Invalid referral code' }

    const { data: existing } = await this.supabase.from('referrals')
      .select('id').eq('code', payload.code).eq('invitee_email', payload.inviteeEmail).maybeSingle()

    if (existing) return { success: true, message: 'Invite already tracked' }

    const { error } = await this.supabase.from('referrals').insert({
      referrer_id: referrer.id,
      invitee_email: payload.inviteeEmail || null,
      code: payload.code,
      status: 'pending',
    })

    if (error) return { success: false, message: error.message }

    await this.supabase.from('user_profiles').update({
      referral_count: this.supabase.rpc('increment', { x: 1 }),
    }).eq('id', referrer.id)

    return { success: true, message: 'Invite tracked' }
  }

  private async processConversion(inviteeId: string): Promise<AgentResult> {
    const { data: invitee } = await this.supabase.from('user_profiles')
      .select('id, referred_by').eq('id', inviteeId).single()

    if (!invitee?.referred_by) return { success: false, message: 'No referrer found' }

    const { data: referral } = await this.supabase.from('referrals')
      .select('id').eq('invitee_id', inviteeId).maybeSingle()

    if (referral) {
      await this.supabase.from('referrals').update({
        status: 'converted',
        converted_at: new Date().toISOString(),
      }).eq('id', referral.id)

      await this.rewardReferrer(referral.id)
    }

    return { success: true, message: 'Conversion processed' }
  }

  private async rewardReferrer(referralId: string): Promise<AgentResult> {
    const { data: referral } = await this.supabase.from('referrals')
      .select('*').eq('id', referralId).single()

    if (!referral) return { success: false, message: 'Referral not found' }

    const reward = 5.00

    const { error } = await this.supabase.from('referrals')
      .update({ reward_earned: reward, reward_type: 'credit' })
      .eq('id', referralId)

    if (error) return { success: false, message: error.message }

    await this.supabase.from('user_profiles').update({
      reward_balance: this.supabase.rpc('increment', { x: reward }),
    }).eq('id', referral.referrer_id)

    return { success: true, message: `Referrer rewarded $${reward}` }
  }

  private async getReferralStats(userId: string): Promise<AgentResult> {
    const [referralsRes, profileRes] = await Promise.all([
      this.supabase.from('referrals').select('*').eq('referrer_id', userId),
      this.supabase.from('user_profiles').select('referral_code, referral_count, reward_balance')
        .eq('id', userId).single(),
    ])

    const referrals = referralsRes.data || []
    const profile = profileRes.data

    return {
      success: true,
      message: 'Referral stats retrieved',
      data: {
        code: profile?.referral_code,
        total_invites: referrals.length,
        pending: referrals.filter((r: any) => r.status === 'pending').length,
        converted: referrals.filter((r: any) => r.status === 'converted').length,
        reward_balance: profile?.reward_balance || 0,
        referral_count: profile?.referral_count || 0,
        referrals,
      } as any,
    }
  }
}
