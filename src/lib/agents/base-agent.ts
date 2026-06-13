import { createClient, createServiceClient } from '@/lib/supabase/client'

export interface AgentResult {
  success: boolean
  message: string
  data?: Record<string, unknown>
  error?: string
}

export abstract class BaseAgent {
  public readonly name: string
  private _supabase: any
  protected maxRetries: number

  constructor(name: string, maxRetries = 3) {
    this.name = name
    this.maxRetries = maxRetries
  }

  protected get supabase() {
    if (!this._supabase) {
      this._supabase = createServiceClient()
    }
    return this._supabase
  }

  abstract execute(action: string, payload?: Record<string, unknown>): Promise<AgentResult>

  async run(action: string, payload?: Record<string, unknown>): Promise<AgentResult> {
    const taskId = await this.createTask(action, payload)

    await this.updateTask(taskId, { status: 'running', started_at: new Date().toISOString() })

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this.execute(action, payload)
        await this.updateTask(taskId, {
          status: 'completed',
          result: result.data || { success: true },
          completed_at: new Date().toISOString(),
        })
        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error(`[${this.name}] Attempt ${attempt}/${this.maxRetries} failed:`, errorMessage)

        if (attempt === this.maxRetries) {
          await this.updateTask(taskId, {
            status: 'failed',
            error: errorMessage,
            completed_at: new Date().toISOString(),
          })
          return { success: false, message: errorMessage, error: errorMessage }
        }
      }
    }

    return { success: false, message: 'Max retries exceeded' }
  }

  private async createTask(action: string, payload?: Record<string, unknown>): Promise<string> {
    const { data, error } = await this.supabase
      .from('agent_tasks')
      .insert({
        agent_name: this.name,
        action,
        payload: payload || {},
        status: 'pending',
      })
      .select('id')
      .single()

    if (error) throw new Error(`Failed to create task: ${error.message}`)
    return data.id
  }

  protected async updateTask(taskId: string, updates: Record<string, unknown>): Promise<void> {
    const { error } = await this.supabase
      .from('agent_tasks')
      .update(updates)
      .eq('id', taskId)

    if (error) console.error(`[${this.name}] Failed to update task ${taskId}:`, error.message)
  }

  protected async log(message: string, level: 'info' | 'warn' | 'error' = 'info'): Promise<void> {
    const prefix = level === 'error' ? 'ERROR' : level === 'warn' ? 'WARN' : 'INFO'
    console.log(`[${this.name}] [${prefix}] ${message}`)
  }
}
