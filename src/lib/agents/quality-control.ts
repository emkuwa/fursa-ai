import { BaseAgent, type AgentResult } from './base-agent'
import { callAI } from '@/lib/ai/client'

export class QualityControlAgent extends BaseAgent {
  constructor() {
    super('quality_control', 3)
  }

  async execute(action: string, _payload?: Record<string, unknown>): Promise<AgentResult> {
    switch (action) {
      case 'audit':
        return this.auditAll()
      case 'approve':
        return this.approvePending()
      case 'check-links':
        return this.checkBrokenLinks()
      case 'check-accuracy':
        return this.checkAccuracy()
      default:
        return { success: false, message: `Unknown action: ${action}` }
    }
  }

  private async auditAll(): Promise<AgentResult> {
    const results = await Promise.all([
      this.checkBrokenLinks(),
      this.checkAccuracy(),
      this.checkMissingDeadlines(),
      this.checkDuplicateContent(),
    ])

    const totalIssues = results.reduce((sum, r) => sum + (r.data?.issuesCount as number || 0), 0)
    return { success: true, message: `Audit complete: ${totalIssues} issues found` }
  }

  private async approvePending(): Promise<AgentResult> {
    const { data: pending, error: fetchError } = await this.supabase
      .from('opportunities')
      .select('id, title, url, category, quality_score')
      .eq('status', 'pending')

    if (fetchError) return { success: false, message: `Failed to fetch pending: ${fetchError.message}` }
    if (!pending?.length) return { success: true, message: 'No pending opportunities', data: { approved: 0, remaining: 0 } as any }

    let approved = 0
    let remaining = 0

    for (const opp of pending) {
      const hasTitle = !!opp.title
      const hasUrl = !!opp.url
      const hasCategory = !!opp.category
      const hasMinScore = (opp.quality_score ?? 0) >= 50

      if (hasTitle && hasUrl && hasCategory && hasMinScore) {
        await this.supabase
          .from('opportunities')
          .update({ status: 'approved' })
          .eq('id', opp.id)
        approved++
      } else {
        remaining++
      }
    }

    await this.log(`Approval complete: ${approved} approved, ${remaining} remaining pending`)
    return {
      success: true,
      message: `Approved ${approved} opportunities, ${remaining} remaining pending`,
      data: { approved, remaining, total: pending.length } as any,
    }
  }

  private async checkBrokenLinks(): Promise<AgentResult> {
    const { data: opportunities } = await this.supabase
      .from('opportunities')
      .select('id, url, application_link')
      .in('status', ['approved', 'featured'])
      .limit(200)

    if (!opportunities?.length) return { success: true, message: 'No opportunities to check', data: { issuesCount: 0 } }

    let brokenCount = 0
    for (const opp of opportunities) {
      const urlsToCheck = [opp.url, opp.application_link].filter(Boolean) as string[]
      for (const url of urlsToCheck) {
        try {
          const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) })
          if (!res.ok) {
            await this.supabase
              .from('opportunities')
              .update({ quality_score: Math.max(0, await this.getCurrentScore(opp.id) - 20) })
              .eq('id', opp.id)
            brokenCount++
          }
        } catch {
          await this.supabase
            .from('opportunities')
            .update({ status: 'rejected' })
            .eq('id', opp.id)
          brokenCount++
        }
      }
    }

    await this.log(`Found ${brokenCount} broken links`)
    return { success: true, message: `Checked ${opportunities.length} opportunities`, data: { issuesCount: brokenCount } }
  }

  private async checkAccuracy(): Promise<AgentResult> {
    const { data: opportunities } = await this.supabase
      .from('opportunities')
      .select('id, title, description, summary, category')
      .in('status', ['approved', 'featured'])
      .is('quality_score', null)
      .limit(50)

    if (!opportunities?.length) return { success: true, message: 'No opportunities to verify', data: { issuesCount: 0 } }

    let issues = 0
    for (const opp of opportunities) {
      const prompt = `Verify the accuracy of this opportunity:
Title: ${opp.title}
Description: ${opp.description.slice(0, 1000)}
Summary: ${opp.summary || 'No summary'}
Category: ${opp.category}

Is this opportunity legitimate? Rate 1-10. Flag any issues. Return JSON:
{
  "legitimate_score": 8,
  "issues": ["issue1"],
  "suggestions": ["suggestion1"]
}`

      const result = await callAI(prompt, 'analysis')
      try {
        const parsed = JSON.parse(result.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())
        if (parsed.legitimate_score < 5) {
          await this.supabase
            .from('opportunities')
            .update({ status: 'rejected' })
            .eq('id', opp.id)
          issues++
        } else {
          await this.supabase
            .from('opportunities')
            .update({ quality_score: parsed.legitimate_score * 10 })
            .eq('id', opp.id)
        }
      } catch {
        await this.log(`Failed to verify opportunity ${opp.id}`, 'error')
      }
    }

    return { success: true, message: `Found ${issues} questionable opportunities`, data: { issuesCount: issues } }
  }

  private async checkMissingDeadlines(): Promise<AgentResult> {
    const { data: opportunities } = await this.supabase
      .from('opportunities')
      .select('id, title, deadline')
      .is('deadline', null)
      .in('status', ['pending', 'approved'])

    const count = opportunities?.length || 0
    if (count > 0) {
      await this.log(`Found ${count} opportunities with missing deadlines`, 'warn')
    }

    return { success: true, message: `Found ${count} missing deadlines`, data: { issuesCount: count } }
  }

  private async checkDuplicateContent(): Promise<AgentResult> {
    const { data: opportunities } = await this.supabase
      .from('opportunities')
      .select('id, title')
      .eq('status', 'pending')

    if (!opportunities?.length) return { success: true, message: 'No pending opportunities', data: { issuesCount: 0 } }

    let duplicates = 0
    const seen = new Set<string>()

    for (const opp of opportunities) {
      const normalized = opp.title.toLowerCase().replace(/[^\w\s]/g, '').trim()
      if (seen.has(normalized)) {
        await this.supabase
          .from('opportunities')
          .update({ status: 'rejected' })
          .eq('id', opp.id)
        duplicates++
      }
      seen.add(normalized)
    }

    return { success: true, message: `Found ${duplicates} duplicates`, data: { issuesCount: duplicates } }
  }

  private async getCurrentScore(opportunityId: string): Promise<number> {
    const { data } = await this.supabase
      .from('opportunities')
      .select('quality_score')
      .eq('id', opportunityId)
      .single()
    return data?.quality_score || 50
  }
}
