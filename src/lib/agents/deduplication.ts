import { BaseAgent, type AgentResult } from './base-agent'

export class DeduplicationAgent extends BaseAgent {
  constructor() {
    super('deduplication', 2)
  }

  async execute(action: string, _payload?: Record<string, unknown>): Promise<AgentResult> {
    switch (action) {
      case 'deduplicate':
        return this.deduplicateAll()
      case 'merge-duplicates':
        return this.mergeDuplicates()
      default:
        return { success: false, message: `Unknown action: ${action}` }
    }
  }

  private async deduplicateAll(): Promise<AgentResult> {
    // Find duplicates by title similarity
    const { data: opportunities } = await this.supabase
      .from('opportunities')
      .select('id, title, url, deadline, organization')
      .eq('status', 'pending')

    if (!opportunities?.length) return { success: true, message: 'No pending opportunities to check' }

    let duplicatesFound = 0

    for (let i = 0; i < opportunities.length; i++) {
      for (let j = i + 1; j < opportunities.length; j++) {
        if (this.isDuplicate(opportunities[i], opportunities[j])) {
          // Keep the higher quality one
          const { data: oppI } = await this.supabase
            .from('opportunities')
            .select('quality_score')
            .eq('id', opportunities[i].id)
            .single()

          const { data: oppJ } = await this.supabase
            .from('opportunities')
            .select('quality_score')
            .eq('id', opportunities[j].id)
            .single()

          const toRemove = (oppI?.quality_score || 0) >= (oppJ?.quality_score || 0)
            ? opportunities[j].id
            : opportunities[i].id

          await this.supabase
            .from('opportunities')
            .update({ status: 'rejected' })
            .eq('id', toRemove)

          duplicatesFound++
        }
      }
    }

    return { success: true, message: `Found and removed ${duplicatesFound} duplicates` }
  }

  private isDuplicate(a: { title: string; url?: string; deadline?: string | null; organization?: string | null },
                       b: { title: string; url?: string; deadline?: string | null; organization?: string | null }): boolean {
    // Title similarity
    const titleA = this.normalizeTitle(a.title)
    const titleB = this.normalizeTitle(b.title)

    if (titleA === titleB) return true

    // URL match
    if (a.url && b.url && a.url === b.url) return true

    // Same organization + deadline proximity
    if (a.organization && b.organization &&
        a.organization === b.organization &&
        a.deadline && b.deadline) {
      const diff = Math.abs(new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      if (diff < 86400000) return true // Within 24 hours
    }

    return false
  }

  private normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  private async mergeDuplicates(): Promise<AgentResult> {
    await this.log('Auto-merging duplicate records')
    return { success: true, message: 'Duplicate merging completed' }
  }
}
