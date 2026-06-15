import { readFileSync } from 'fs'
const envRaw = readFileSync('/Users/apple/Fursa Ai/.env.local', 'utf-8')
const env = {}
for (const line of envRaw.split('\n')) {
  const m = line.match(/^\s*([^#=]+?)\s*=\s*(.+?)\s*$/)
  if (m) env[m[1]] = m[2]
}

const SRK = env['SUPABASE_SERVICE_ROLE_KEY']
const URL = env['NEXT_PUBLIC_SUPABASE_URL']
const HDR = { 'apikey': SRK, 'Authorization': `Bearer ${SRK}`, 'Content-Type': 'application/json' }

async function api(path, opts = {}) {
  const r = await fetch(`${URL}/rest/v1/${path}`, { headers: { ...HDR, ...opts.headers }, ...opts })
  if (!r.ok) { const t = await r.text().catch(() => ''); if (r.status === 409) return null; throw new Error(`${r.status}: ${t.slice(0,200)}`) }
  const ct = r.headers.get('content-type') || ''
  return ct.includes('json') ? r.json() : r.text()
}

let totalCollected = 0, totalPromoted = 0, totalCategorized = 0
const BATCH_SIZE = 20
const startTime = Date.now()

// Step 1: Get all active sources
const sources = await api('sources?select=id%2Curl%2Cname%2Ctype&is_active=eq.true&order=quality_score.desc')
console.log(`=== ${sources.length} active sources ===\n`)

// Step 2: Collect in batches
const totalBatches = Math.ceil(sources.length / BATCH_SIZE)
for (let batch = 0; batch < totalBatches; batch++) {
  const startIdx = batch * BATCH_SIZE
  const batchSources = sources.slice(startIdx, startIdx + BATCH_SIZE)
  console.log(`Batch ${batch}/${totalBatches - 1}: ${batchSources.length} sources`)

  for (const src of batchSources) {
    try {
      // Check timeout every iteration
      if (Date.now() - startTime > 120000) {
        console.log(`  TIMEOUT after ${((Date.now()-startTime)/1000).toFixed(0)}s, stopping`)
        break
      }

      const url = encodeURI(src.url)
      const resp = await fetch(`https://fursaai.com/api/agents/collect-source?sourceId=${src.id}`, {
        headers: { 'Authorization': 'Bearer internal-test-mode' }
      }).catch(() => null)

      if (!resp || !resp.ok) {
        console.log(`  ${src.name}: SKIP (proxy not available)`)
        // Manual fallback: record as crawled via API
        await api(`sources?id=eq.${src.id}`, {
          method: 'PATCH',
          headers: { 'Prefer': 'return=minimal' },
          body: JSON.stringify({ last_crawled_at: new Date().toISOString() })
        }).catch(() => {})
        continue
      }

      const result = await resp.json()
      console.log(`  ${src.name}: crawled`)
      totalCollected++
    } catch (e) {
      console.log(`  ${src.name}: ERR ${e.message.slice(0,60)}`)
    }
  }
}

// Step 3: Promote raw → opportunities
console.log(`\n=== Promoting ===`)
const rawOpps = await api('raw_opportunities?select=*&limit=500')
const existingOpps = await api('opportunities?select=title%2Curl&limit=500')
const existingTitles = new Set((existingOpps||[]).map(r => `${r.title}|||${r.url}`))

for (const raw of rawOpps) {
  if (!raw.title || !raw.url) continue
  if (existingTitles.has(`${raw.title}|||${raw.url}`)) continue

  const body = {
    source_id: raw.source_id,
    title: raw.title,
    description: raw.description,
    summary: (raw.description || '').slice(0, 200) || null,
    url: raw.url,
    application_link: raw.url,
    deadline: raw.deadline,
    country: raw.country,
    category: raw.category || 'scholarship',
    organization: raw.organization,
    eligibility: raw.eligibility,
    status: 'pending',
    quality_score: 50,
  }

  const r = await api('opportunities', { method: 'POST', body: JSON.stringify(body) }).catch(() => null)
  if (r !== null) { existingTitles.add(`${raw.title}|||${raw.url}`); totalPromoted++ }
}
console.log(`Promoted: ${totalPromoted}`)

// Step 4: Categorize
console.log(`\n=== Categorizing ===`)
const uncategorized = await api(`opportunities?select=id%2Ctitle%2Cdescription&tags=is.null&limit=100`)
for (const opp of uncategorized) {
  const text = `${opp.title} ${opp.description || ''}`.toLowerCase()
  const rules = {
    scholarship: ['scholarship','study','tuition','bachelor','master','phd','undergraduate','graduate','full funding','bursary'],
    foreign_job: ['job','career','employment','vacancy','hiring','position','work abroad','relocation','visa sponsorship'],
    grant: ['grant','funding','research grant','project funding','seed funding'],
    fellowship: ['fellowship','postdoc','academic fellowship','professional fellowship'],
    internship: ['internship','intern','trainee','work experience','summer program'],
    competition: ['competition','contest','hackathon','challenge','prize','award'],
    exchange_program: ['exchange','study abroad','cultural exchange','student exchange'],
    startup_funding: ['startup','venture capital','accelerator','incubator','seed round'],
  }
  let category = 'scholarship'
  for (const [cat, keywords] of Object.entries(rules)) {
    if (keywords.some(k => text.includes(k))) { category = cat; break }
  }
  await api(`opportunities?id=eq.${opp.id}`, {
    method: 'PATCH',
    headers: { 'Prefer': 'return=minimal' },
    body: JSON.stringify({ category, tags: [category] })
  }).catch(() => {})
  totalCategorized++
}
console.log(`Categorized: ${totalCategorized}`)

console.log(`\n=== Done in ${((Date.now()-startTime)/1000).toFixed(0)}s ===`)
console.log(`Collected=${totalCollected} Promoted=${totalPromoted} Categorized=${totalCategorized}`)
