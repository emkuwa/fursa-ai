import { createServiceClient } from '@/lib/supabase/client'
import { runAgent } from '@/lib/agents/orchestrator'

export class JobQueue {
  private supabase
  private processing: Set<string> = new Set()

  constructor() {
    this.supabase = createServiceClient()
  }

  async enqueue(queue: string, agentName: string, action: string, payload: Record<string, unknown> = {}, priority = 0): Promise<string> {
    const { data, error } = await this.supabase
      .from('queue_jobs')
      .insert({
        queue,
        agent_name: agentName,
        action,
        payload,
        priority,
        status: 'queued',
        max_retries: 3,
        retry_count: 0,
        scheduled_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) throw new Error(`Failed to enqueue job: ${error.message}`)
    return data.id
  }

  async processQueue(queue: string, batchSize = 5): Promise<number> {
    const { data: jobs } = await this.supabase
      .from('queue_jobs')
      .select('*')
      .eq('queue', queue)
      .eq('status', 'queued')
      .order('priority', { ascending: false })
      .order('scheduled_at', { ascending: true })
      .limit(batchSize)

    if (!jobs?.length) return 0

    let processed = 0
    for (const job of jobs as any[]) {
      if (this.processing.has(job.id)) continue
      this.processing.add(job.id)

      try {
        await this.supabase
          .from('queue_jobs')
          .update({ status: 'processing', started_at: new Date().toISOString() })
          .eq('id', job.id)

        const result = await runAgent(job.agent_name, job.action, job.payload)

        await this.supabase
          .from('queue_jobs')
          .update({
            status: result.success ? 'completed' : 'failed',
            completed_at: new Date().toISOString(),
            error: result.success ? null : result.error || 'Unknown error',
          })
          .eq('id', job.id)

        processed++
      } catch (error: any) {
        const newRetryCount = (job.retry_count || 0) + 1
        const status = newRetryCount >= (job.max_retries || 3) ? 'failed' : 'retrying'

        await this.supabase
          .from('queue_jobs')
          .update({
            status,
            retry_count: newRetryCount,
            error: error.message,
            completed_at: status === 'failed' ? new Date().toISOString() : null,
            scheduled_at: status === 'retrying' ? new Date(Date.now() + 60000 * newRetryCount).toISOString() : null,
          })
          .eq('id', job.id)

        if (status === 'failed') {
          await this.supabase
            .from('agent_tasks')
            .insert({
              agent_name: job.agent_name,
              action: job.action,
              payload: job.payload,
              status: 'failed',
              error: `Queue retry exhausted: ${error.message}`,
            })
            .maybeSingle()
        }
      } finally {
        this.processing.delete(job.id)
      }
    }

    return processed
  }

  async processAllQueues(): Promise<Record<string, number>> {
    const { data: queues } = await this.supabase
      .from('queue_jobs')
      .select('queue')
      .eq('status', 'queued')

    const queueSet = new Set((queues || []).map((q: any) => q.queue))
    const results: Record<string, number> = {}

    for (const queue of queueSet) {
      results[queue] = await this.processQueue(queue)
    }

    return results
  }

  async getQueueStats(): Promise<Record<string, any>> {
    const { data: stats } = await this.supabase
      .from('queue_jobs')
      .select('queue, status, count:status', { count: 'exact' })

    const result: Record<string, any> = {}
    for (const row of (stats || []) as any[]) {
      if (!result[row.queue]) result[row.queue] = {}
      result[row.queue][row.status] = row.count
    }

    return result
  }

  async retryFailedJobs(queue?: string, limit = 50): Promise<number> {
    let query = this.supabase
      .from('queue_jobs')
      .select('id')
      .eq('status', 'failed')
      .lt('retry_count', 5)
      .limit(limit)

    if (queue) query = query.eq('queue', queue)

    const { data: failed } = await query
    if (!failed?.length) return 0

    const ids = failed.map((f: any) => f.id)
    await this.supabase
      .from('queue_jobs')
      .update({ status: 'queued', error: null, retry_count: 0 })
      .in('id', ids)

    return ids.length
  }
}

export const jobQueue = new JobQueue()
