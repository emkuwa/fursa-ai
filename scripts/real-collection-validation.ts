import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// config({ path: '.env.local' })
const supabaseUrl = 'https://beyuxtqfeymqqaycjzuk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJleXV4dHFmZXltcXFheWNqenVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM2MTA4MiwiZXhwIjoyMDk1OTM3MDgyfQ.H1m_qa_S35PENMFlJW94MX8SblEYBDytcx8NujjQu3I'

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 0,
    },
  },
})

async function runValidation() {
  console.log('=== Fursa AI Job Collection Validation ===\n')

  // 2. Query counts
  const { data: counts, error: countError } = await supabase.rpc('get_category_counts')
  
  // If RPC doesn't exist, we'll do manual counts
  const categories = ['scholarship', 'foreign_job', 'grant', 'fellowship', 'internship', 'tender', 'competition']
  const results: any = {}
  
  for (const cat of categories) {
    const { count } = await supabase.from('opportunities').select('*', { count: 'exact', head: true }).eq('category', cat)
    results[cat] = count || 0
  }

  const { count: totalRaw } = await supabase.from('raw_opportunities').select('*', { count: 'exact', head: true })
  const { count: totalOpp } = await supabase.from('opportunities').select('*', { count: 'exact', head: true })
  const { count: totalApproved } = await supabase.from('opportunities').select('*', { count: 'exact', head: true }).eq('status', 'approved')

  console.log('2. Opportunity Counts:')
  console.log(`Total raw records: ${totalRaw}`)
  console.log(`Total opportunities: ${totalOpp}`)
  console.log(`Total approved: ${totalApproved}`)
  console.log(`Scholarships: ${results.scholarship}`)
  console.log(`Foreign Jobs: ${results.foreign_job}`)
  console.log(`Grants: ${results.grant}`)
  console.log(`Fellowships: ${results.fellowship}`)
  console.log(`Internships: ${results.internship}\n`)

  // 3. Top 20 newest foreign_job
  console.log('3. Top 20 Newest Foreign Jobs:')
  const { data: jobs } = await supabase
    .from('opportunities')
    .select('title, organization, country, created_at, status')
    .eq('category', 'foreign_job')
    .order('created_at', { ascending: false })
    .limit(20)

  if (jobs && jobs.length > 0) {
    console.table(jobs)
  } else {
    console.log('No foreign job records found.\n')
  }

  // 4. Jobs by source
  console.log('4. Foreign Jobs by Organization:')
  const { data: sourceCounts } = await supabase.rpc('get_opportunities_by_org', { cat: 'foreign_job' })
  if (sourceCounts) {
     console.table(sourceCounts)
  } else {
     // Manual aggregation if RPC fails
     const { data: allJobs } = await supabase.from('opportunities').select('organization').eq('category', 'foreign_job')
     const counts: any = {}
     allJobs?.forEach(j => { counts[j.organization || 'Unknown'] = (counts[j.organization || 'Unknown'] || 0) + 1 })
     console.table(Object.entries(counts).map(([org, count]) => ({ organization: org, count })))
  }

  // 5. Jobs by country
  console.log('\n5. Foreign Jobs by Country:')
  const { data: countryJobs } = await supabase.from('opportunities').select('country').eq('category', 'foreign_job')
  const cCounts: any = {}
  countryJobs?.forEach(j => { cCounts[j.country || 'Remote/Global'] = (cCounts[j.country || 'Remote/Global'] || 0) + 1 })
  console.table(Object.entries(cCounts).map(([country, count]) => ({ country, count })))

  // 7. Search verification
  console.log('\n7. Search Verification:')
  const queries = ['jobs', 'ngo jobs', 'remote jobs', 'un jobs']
  for (const q of queries) {
     const { count } = await supabase.from('opportunities')
        .select('*', { count: 'exact', head: true })
        .textSearch('fts', q)
     console.log(`Query "${q}": ${count || 0} results`)
  }
}

runValidation().catch(console.error)
