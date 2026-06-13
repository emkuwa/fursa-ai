'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AGENTS } from '@/lib/constants'
import { Play, RotateCw, AlertTriangle, CheckCircle, Clock, Bot } from 'lucide-react'

export default function AdminAgentsPage() {
  const [taskStats, setTaskStats] = useState<Record<string, any>>({})
  const [running, setRunning] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    const supabase = createClient()
    const stats: Record<string, any> = {}

    for (const agent of AGENTS) {
      const total = (await supabase.from('agent_tasks').select('*', { count: 'exact', head: true }).eq('agent_name', agent.name)).count ?? 0
      const failed = (await supabase.from('agent_tasks').select('*', { count: 'exact', head: true }).eq('agent_name', agent.name).eq('status', 'failed')).count ?? 0
      const { data: tasks } = await supabase.from('agent_tasks').select('created_at').eq('agent_name', agent.name).order('created_at', { ascending: false }).limit(1)
      const lastRun = tasks?.[0]?.created_at || null
      stats[agent.name] = { total, failed, lastRun }
    }

    setTaskStats(stats)
  }

  const runAgent = async (agentName: string) => {
    setRunning(agentName)
    try {
      await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: agentName, action: agentName === 'source_discovery' ? 'initialize' : 'collect' }),
      })
    } finally {
      setRunning(null)
      loadStats()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Agents</h1>
          <p className="text-gray-600">Monitor and manage your AI workforce</p>
        </div>
        <Button variant="outline" onClick={loadStats}><RotateCw className="w-4 h-4 mr-2" />Refresh</Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {AGENTS.map(agent => {
          const stats = taskStats[agent.name] || { total: 0, failed: 0, lastRun: null }
          return (
            <Card key={agent.name}>
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Bot className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{agent.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                    <p className="text-sm text-gray-500">{agent.description}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>Cron: {agent.cron_schedule}</span>
                      <span>Tasks: {stats.total}</span>
                      {stats.failed > 0 && <span className="text-red-500">Errors: {stats.failed}</span>}
                      {stats.lastRun && <span>Last: {new Date(stats.lastRun).toLocaleDateString()}</span>}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => runAgent(agent.name)}
                  loading={running === agent.name}
                >
                  <Play className="w-4 h-4 mr-1" />
                  Run
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
