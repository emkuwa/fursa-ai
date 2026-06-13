-- Fursa AI Phase 33: Queue Jobs RLS Policies
-- The service_role bypasses RLS entirely (used by JobQueue internally).
-- These policies ensure authenticated admin users can also manage jobs.

-- Admin full access to queue_jobs
CREATE POLICY "Admin full access queue_jobs" ON queue_jobs
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin')
  );

-- Authenticated users can view their own job status (if user_id is added later)
CREATE POLICY "Users view own queue jobs" ON queue_jobs
  FOR SELECT USING (
    payload->>'user_id' = auth.uid()::text
  );
