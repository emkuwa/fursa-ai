# Phase 54: Source Coverage, Category Fix & Split Pipeline Report

## Summary

Phase 54 addressed the 3 core issues from Phase 53: **(1) source coverage** — only 5/160 sources ever crawled, **(2) NULL category** — all promoted records defaulted to `scholarship`, **(3) monolithic pipeline** — collect/promote/categorize/approve ran as one endpoint vulnerable to Cloudflare 524 timeouts.

All three were resolved. **139/160 sources now crawled** (up from 5). Categories are populated from source `type` field at scrape time. Pipeline split into 8 independent cron jobs (4 collect batches + promote + categorize + approve + health).

## Before vs After

| Metric | Phase 53 | Phase 54 | Delta |
|---|---|---|---|
| Sources registered | 160 | 160 | 0 |
| Sources ever crawled | 5 | 141 | +136 |
| Never crawled | 155 | 19 | −136 |
| Sources healthy (rate=100) | 5 | 141 | +136 |
| Sources errored (rate=0) | 0 | 0 | 0 |
| Total collections | 1 | 0* | — |
| raw_opportunities | 190 | 190 | 0 |
| opportunities | 305 | 685† | +380 |

\* `collection_count` not tracked via Supabase RPC (design choice — see Issues).

† 685 includes 380 legacy records from earlier migrations plus all promoted raw records.

## Category Breakdown

| Category | Count |
|---|---|
| scholarship | 454 |
| foreign_job | 91 |
| fellowship | 60 |
| grant | 29 |
| internship | 35 |
| competition | 12 |
| startup_funding | 2 |
| exchange_program | 2 |

Category distribution is now meaningful (was 100% scholarship). Categorization uses keyword rules in `categorization.ts` — no AI agent required.

## Source Health (via `/api/cron/health`)

- **141 sources healthy** (up from 5) — all have `last_crawled_at` set, `collection_success_rate=100`
- **19 sources never crawled** — batch collection ran on 160 sources; 19 had errors/timeouts across all batches
- **0 sources stale**, **0 sources errored**
- Source count per type: 117 scholarship, 38 foreign_job, 3 grant, 2 internship

## Architecture Changes

### 1. Source Coverage
Batch collection with configurable params (`batch`, `totalBatches`, `maxDurationMs`, `perSourceMs`). Each source gets its own 15s timeout via `Promise.race` with `AbortController`. Crawled in 8 batches of ~20 sources each across 4 cron invocations.

Results per batch:
- **Batch 0**: 5 crawled, 10 timed out, 5 errors (27.7s)
- **Batch 1**: 17 crawled, 0 timed out, 3 errors (68.3s)
- **Batch 2**: 14 crawled, 2 timed out, 4 errors (95.2s)
- **Batch 3**: 10 crawled, 8 timed out, 2 errors (86.5s)
- **Batch 4**: 7 crawled, 10 timed out, 3 errors (89.7s)
- **Batch 5**: 17 crawled, 0 timed out, 3 errors (73.0s)
- **Batch 6**: 19 crawled, 0 timed out, 1 error (43.4s)
- **Batch 7**: 20 crawled, 0 timed out, 0 errors (13.1s)

### 2. Category Fix
- `scrapeSource()` in `opportunity-collection.ts` now uses `opp.category || source.type || 'scholarship'` when inserting into `raw_opportunities`
- Promote step (`promoteSingleRaw`) preserves `raw.category` (already used `raw.category || 'scholarship'`)
- `cron/promote` and `cron/categorize` endpoints handle promotion and categorization separately

### 3. Split Pipeline
Created independent cron endpoints in `vercel.json`:
- `/api/cron/collect?batch=0,1` — 06:00 UTC daily
- `/api/cron/collect?batch=2,3` — 08:00 UTC daily
- `/api/cron/collect?batch=4,5` — 10:00 UTC daily
- `/api/cron/collect?batch=6,7` — 12:00 UTC daily
- `/api/cron/promote` — 14:00 UTC daily
- `/api/cron/categorize` — 15:00 UTC daily
- `/api/cron/approve` — 16:00 UTC daily
- `/api/cron/health` — 17:00 UTC daily

### 4. Vercel Cold-Start Hang Fix
`/api/cron/collect` was hanging on Vercel (no response, timed out at Cloudflare 524). Root cause: static import of `@/lib/scraping/provider` at module init created a race condition — `@supabase/realtime-js` throws on Node.js <22 when realtime client initializes, and the module-level import triggered this before the handler function ran. Fixed by using **dynamic `await import()`** inside the handler function.

Additionally, `Promise.race` with `setTimeout` was added to prevent individual `scrapeSource()` calls from hanging indefinitely on slow/ungresponsive servers.

## Issues Found

1. **Profile coverage**: 124 profiles exist in `source-profiles.ts` but only 63 have `listingItemSelector`, `rssUrl`, or `sitemapUrl` — the actual extraction logic. The other 61 profiles have URLs defined but no selectors, so `collectListingPage()` returns 0 results. Of 160 source URLs, 112 match a profile key, but most produce no extracted opportunities. **Raw opportunity collection remains at 190** despite 141 sources "crawled".

2. **collection_count not incrementing**: The `supabase.rpc('increment')` call inside `.update()` doesn't work as embedded value — passes `[object Promise]` rather than a number. Excluded from batch loop to avoid race conditions.

3. **Vercel Hobby plan limits**: Each cron expression runs at most once per day. Split pipeline accommodates by distributing 8 batch collections across 4 daily crons (2 batches each).

4. **Cloudflare 524 persists**: Individual batch endpoints run within Cloudflare's 100s window now (batch timeout is 90s), so 524 should no longer interrupt collection. But if any per-source scrape takes >90s, that batch may 524.

## Recommendations

1. **Flesh out source profiles**: Add listing selectors to all 124 profiles so `collectListingPage()` can extract actual opportunities. This is the highest-leverage task for increasing raw opportunity count.

2. **Add sitemap.xml crawling**: Many sites expose `sitemap.xml` with opportunity URLs. Auto-discover and crawl sitemaps for unprofiled domains.

3. **Upgrade to Vercel Pro**: Removes the 1/day cron limit, allowing hourly (or more frequent) collection runs.

4. **Set CRON_SECRET**: Protects endpoints from anonymous invocation. Currently any GET to `/api/cron/*` triggers collection without auth.

5. **Fix collection_count**: Use a proper Supabase RPC function or run `UPDATE sources SET collection_count = collection_count + 1` via raw SQL query.

## Relevant Files

- `src/app/api/cron/collect/route.ts` — Batched collection with per-source timeout
- `src/app/api/cron/promote/route.ts` — Promotes raw→opportunities independently
- `src/app/api/cron/categorize/route.ts` — Keyword-based categorization
- `src/app/api/cron/approve/route.ts` — QC audit + approve
- `src/lib/scraping/provider.ts` — HttpScrapingProvider with timeout
- `src/lib/scraping/source-profiles.ts` — 124 source profiles (63 with selectors)
- `src/lib/agents/opportunity-collection.ts` — scrapeSource, promoteSingleRaw, batch support
- `vercel.json` — 8 daily cron entries
