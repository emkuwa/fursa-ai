import { readFileSync } from 'fs'

const envRaw = readFileSync('/Users/apple/Fursa Ai/.env.local', 'utf-8')
const env: Record<string, string> = {}
for (const line of envRaw.split('\n')) {
  const m = line.match(/^\s*([^#=]+?)\s*=\s*(.+?)\s*$/)
  if (m) env[m[1]] = m[2]
}

const URL = env['NEXT_PUBLIC_SUPABASE_URL']!
const KEY = env['SUPABASE_SERVICE_ROLE_KEY']!
const headers = { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' }

async function api(path: string, opts?: any) {
  const reqHeaders = { ...headers, ...(opts?.headers || {}) }
  const r = await fetch(`${URL}/rest/v1/${path}`, { ...opts, headers: reqHeaders })
  if (!r.ok && r.status !== 409) { const t = await r.text().catch(() => ''); throw new Error(`${r.status}: ${t.slice(0, 200)}`) }
  return r.status === 204 || r.status === 201 ? null : r.json()
}

async function main() {
  const t0 = Date.now()
  console.log('=== PHASE 54 LOCAL RUN (raw fetch) ===\n')

  // 1. Sources
  const sources: any[] = await api('sources?select=id,url,name,type&is_active=eq.true&order=quality_score.desc&limit=50')
  console.log(`Sources: ${sources.length}`)

  // 2. Mark crawled
  for (const s of sources) {
    await api(`sources?id=eq.${s.id}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ last_crawled_at: new Date().toISOString() }) })
  }
  console.log(`Marked ${sources.length} sources crawled`)

  // 3. Promote raw → opportunities
  const rawOpps: any[] = await api('raw_opportunities?select=*')
  const existingOpps: any[] = await api('opportunities?select=title,url')
  const existingTitles = new Set((existingOpps || []).map((r: any) => `${r.title}|||${r.url}`))
  let promoted = 0, dupes = 0, skipped = 0

  for (const raw of rawOpps) {
    if (!raw.title || !raw.url) { skipped++; continue }
    if (existingTitles.has(`${raw.title}|||${raw.url}`)) { dupes++; continue }
    await api('opportunities', {
      method: 'POST',
      body: JSON.stringify({
        source_id: raw.source_id, title: raw.title, description: raw.description,
        summary: (raw.description || '').slice(0, 200) || null, url: raw.url,
        application_link: raw.url, deadline: raw.deadline, country: raw.country,
        category: raw.category || 'scholarship', organization: raw.organization,
        eligibility: raw.eligibility, status: 'pending', quality_score: 50,
      }),
    }).catch(() => null)
    existingTitles.add(`${raw.title}|||${raw.url}`)
    promoted++
  }
  console.log(`Promote: +${promoted}, dupes: ${dupes}, skip: ${skipped}`)

  // 4. Categorize
  const uncategorised: any[] = await api('opportunities?select=id,title,description&tags=is.null&limit=300')
  const rules: Record<string, string[]> = {
    foreign_job: ['job','career','employment','vacancy','hiring','position','work','visa'],
    scholarship: ['scholarship','study','tuition','bachelor','master','phd','undergrad','graduate','funding','bursary'],
    fellowship: ['fellowship','postdoc','academic fellowship','research fellowship'],
    grant: ['grant','research grant','project funding','seed funding','innovation'],
    internship: ['internship','intern','trainee','work experience','summer program'],
    competition: ['competition','contest','hackathon','challenge','prize','award'],
    exchange_program: ['exchange','cultural exchange','student exchange','study abroad'],
    startup_funding: ['startup','venture capital','accelerator','incubator','seed round'],
  }
  let catCount = 0
  for (const opp of uncategorised) {
    const text = `${opp.title} ${opp.description || ''}`.toLowerCase()
    let category = 'scholarship'
    for (const [cat, kws] of Object.entries(rules)) {
      if (kws.some(k => text.includes(k))) { category = cat; break }
    }
    await api(`opportunities?id=eq.${opp.id}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ category, tags: [category] }) }).catch(() => {})
    catCount++
  }
  console.log(`Categorized: ${catCount}`)

  // 5. Stats
  const all: any[] = await api('opportunities?select=category')
  const counts: Record<string, number> = {}
  for (const o of all) { const c = o.category || 'none'; counts[c] = (counts[c] || 0) + 1 }
  console.log(`\n=== RESULTS (${((Date.now() - t0) / 1000).toFixed(0)}s) ===`)
  console.log(`raw_opportunities: ${rawOpps.length}`)
  console.log(`opportunities: ${all.length}`)
  console.log(`categories:`, counts)
}

main().catch(e => { console.error(e); process.exit(1) })
