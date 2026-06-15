# Phase 53: Live Collection Validation Report

## Summary

The collection engine recovery (Phase 52) was validated against production (Supabase + Vercel). **The pipeline works end-to-end** — records are collected, stored as raw_opportunities, and promoted to the opportunities table.

## Before vs After

| Metric | Before | After | Delta |
|---|---|---|---|
| Sources registered | 150 | 160 | +10 (SourceDiscoveryAgent) |
| raw_opportunities | 178 | 190 | +12 (new discovers) |
| opportunities | 171 | 305 | +134 (promoted from batch) |
| Sources ever crawled | 4 | 5 | +1 (Rhodes Scholarship) |
| Total collections | 0 | 1 | +1 (June 15 18:53) |

## Category Breakdown

| Category | Before | After | Delta |
|---|---|---|---|
| scholarship | 49 | 183 | +134 |
| fellowship | 34 | 34 | 0 |
| foreign_job | 40 | 40 | 0 |
| grant | 24 | 24 | 0 |
| internship | 23 | 23 | 0 |
| competition | 1 | 1 | 0 |

## Source Health (via `/api/cron/health`)

- **5 sources healthy**: Chevening, Fulbright, Gates Cambridge, Rhodes Scholarship, DAAD
- **155 sources never crawled** (out of 160)
- **4 sources stale**: crawled June 13, last seen 2 days ago
- **0 sources errored**
- Health scores: 100 (crawled) / 0 (never crawled)

## Issues Found

1. **Cloudflare 524 timeout**: Production endpoint cuts off at ~125s (Cloudflare proxy limit), but Vercel function continues (max 300s). The `promote` step in `/api/cron/collect` likely never runs via web request.

2. **Source coverage**: Only 5/160 sources (3.1%) have been crawled. At 125s per 160 sources, full crawl requires ~5.5 hours.

3. **Category fallback**: All promoted records default to `scholarship` because raw_opportunities don't have `category` set.

4. **collection_count not incrementing**: The `OpportunityCollectionAgent.collectFromAllSources()` updates `last_crawled_at` but does not increment `collection_count`.

5. **Vercel Hobby cron limits**: Daily cron only. `/api/cron/health` removed from schedule (combined with collect).

## Recommendations

- Add `collection_count += result` update in `collectFromAllSources()`
- Move categorization into the promotion step (pass raw records through categorization agent)
- Consider running collections in smaller batches (e.g. 10 sources per cron invocation) to stay within Cloudflare's 100s limit
- Add a separate `/api/cron/promote` endpoint to run promotion independently
- Upgrade to Vercel Pro for more frequent cron jobs (every 6h instead of daily)
- Set `CRON_SECRET` env var on Vercel to avoid the 524 timeout issue via direct Vercel URL
- Use Vercel's `vercel.json` `crons` with `maxDuration` hints if supported
