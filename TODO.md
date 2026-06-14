# TODO - Source coupling + DB/schema recovery

## Plan-approved steps
- [x] Phase 35: Job Expansion Mission (Added 17+ international job sources)
- [x] Refactor `scripts/collector-validation.ts` to load sources from `src/lib/scraping/source-profiles.ts` (single source of truth). Remove hardcoded `SOURCES` list.
2. [x] Refactor `scripts/collector-validation-top15.ts` to load sources from `src/lib/scraping/source-profiles.ts` and select the Top 15 deterministically (no new sources/features).

3. [ ] Update type expectations so validation scripts compile with `SourceProfile`/`SOURCE_PROFILES` export.
4. [ ] Run migrations in order: `schema.sql` → `002_new_tables.sql` → `003_phase3_tables.sql`.
5. [ ] Verify required tables exist after migrations.
6. [ ] Re-run runtime validation endpoints:
   - [ ] `GET /api/system-health`
   - [ ] `GET /api/admin/validation`

## Notes
- Validation logic/scoring/parsing remains unchanged unless a bug is found.
- Primary priority: DB schema recovery + runtime validation.
- Secondary priority: correct coupling between validation scripts and source definitions.

