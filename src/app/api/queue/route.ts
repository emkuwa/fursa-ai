import { NextRequest, NextResponse } from 'next/server'
import { jobQueue } from '@/lib/queue'
import { requireAdmin } from '@/lib/api-auth'

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin(request)
  if (error) return error

  const body = await request.json().catch(() => ({}))
  const action = body.action || 'enqueue'

  try {
    switch (action) {
      case 'enqueue': {
        const id = await jobQueue.enqueue(body.queue, body.agent, body.actionName, body.payload, body.priority)
        return NextResponse.json({ success: true, jobId: id })
      }
      case 'process': {
        const processed = await jobQueue.processQueue(body.queue || 'default', body.batchSize || 5)
        return NextResponse.json({ success: true, processed })
      }
      case 'process-all': {
        const results = await jobQueue.processAllQueues()
        return NextResponse.json({ success: true, results })
      }
      case 'stats': {
        const stats = await jobQueue.getQueueStats()
        return NextResponse.json({ success: true, stats })
      }
      case 'retry': {
        const count = await jobQueue.retryFailedJobs(body.queue, body.limit)
        return NextResponse.json({ success: true, retried: count })
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Queue operation failed' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin(request)
  if (error) return error

  const stats = await jobQueue.getQueueStats()
  return NextResponse.json({ stats })
}
