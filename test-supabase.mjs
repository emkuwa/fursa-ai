import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const envRaw = readFileSync('/Users/apple/Fursa Ai/.env.local', 'utf-8')
const env = {}
for (const line of envRaw.split('\n')) {
  const m = line.match(/^\s*([^#=]+?)\s*=\s*(.+?)\s*$/)
  if (m) env[m[1]] = m[2]
}

const url = env['NEXT_PUBLIC_SUPABASE_URL'] || ''
const key = env['SUPABASE_SERVICE_ROLE_KEY'] || ''
const supabase = createClient(url, key, {
  auth: { persistSession: false },
  realtime: { transport: null }
})

async function main() {
  console.log('Test 1: Basic Supabase query')
  const { data, error } = await supabase.from('sources').select('id').limit(1)
  console.log(`  sources: ${error ? 'ERR ' + error.message : (data?.length || 0) + ' rows'}`)

  console.log('Test 2: agent_tasks insert')
  const { data: task, error: taskErr } = await supabase
    .from('agent_tasks')
    .insert({ agent_name: 'test', action: 'test', payload: {}, status: 'pending' })
    .select('id')
    .single()
  console.log(`  insert: ${taskErr ? 'ERR ' + taskErr.message : 'OK id=' + task?.id}`)

  console.log('Test 3: agent_tasks read back')
  const { data: tasks } = await supabase
    .from('agent_tasks')
    .select('id, status')
    .eq('id', task?.id)
    .single()
  console.log(`  read: ${tasks ? 'OK status=' + tasks.status : 'no data'}`)

  console.log('Test 4: agent_tasks update')
  const { error: updateErr } = await supabase
    .from('agent_tasks')
    .update({ status: 'completed' })
    .eq('id', task?.id)
  console.log(`  update: ${updateErr ? 'ERR ' + updateErr.message : 'OK'}`)

  console.log('Test 5: raw_opportunities count')
  const { count } = await supabase
    .from('raw_opportunities')
    .select('*', { count: 'exact', head: true })
  console.log(`  count: ${count}`)

  console.log('\nAll tests passed!')
}

main().catch(e => console.error('FATAL:', e))
