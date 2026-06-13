-- Fursa AI Phase 2: New Tables

-- OPPORTUNITY RANKINGS
CREATE TABLE IF NOT EXISTS opportunity_rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  ranking_date DATE NOT NULL,
  category TEXT NOT NULL,
  rank INTEGER NOT NULL,
  ranking_score INTEGER CHECK (ranking_score >= 0 AND ranking_score <= 100),
  urgency_score INTEGER CHECK (urgency_score >= 0 AND urgency_score <= 100),
  popularity_score INTEGER CHECK (popularity_score >= 0 AND popularity_score <= 100),
  funding_score INTEGER CHECK (funding_score >= 0 AND funding_score <= 100),
  career_impact_score INTEGER CHECK (career_impact_score >= 0 AND career_impact_score <= 100),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(opportunity_id, ranking_date)
);

CREATE INDEX idx_rankings_date ON opportunity_rankings(ranking_date DESC);
CREATE INDEX idx_rankings_category ON opportunity_rankings(category, rank);
CREATE INDEX idx_rankings_score ON opportunity_rankings(ranking_score DESC);

-- SOURCE HEALTH
CREATE TABLE IF NOT EXISTS source_health (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'healthy' CHECK (status IN ('healthy', 'degraded', 'dead')),
  error_rate_24h INTEGER DEFAULT 0,
  collection_count_24h INTEGER DEFAULT 0,
  success_rate_24h INTEGER DEFAULT 100,
  avg_response_time_ms INTEGER DEFAULT 0,
  last_error TEXT,
  checked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_id)
);

CREATE INDEX idx_source_health_status ON source_health(status);

-- QUEUE JOBS
CREATE TABLE IF NOT EXISTS queue_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  queue TEXT NOT NULL DEFAULT 'default',
  agent_name TEXT NOT NULL,
  action TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  priority INTEGER DEFAULT 0,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'retrying')),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_queue_status ON queue_jobs(status, priority DESC, scheduled_at);
CREATE INDEX idx_queue_name ON queue_jobs(queue, status);

-- GENERATED DOCUMENTS
CREATE TABLE IF NOT EXISTS generated_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('cv', 'cover_letter', 'essay', 'motivation_letter', 'grant_concept', 'personal_statement')),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
  suggestions TEXT[],
  is_template BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_docs_user ON generated_documents(user_id, type);
CREATE INDEX idx_docs_template ON generated_documents(is_template) WHERE is_template = true;

-- Add new columns to opportunities
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS ranking_score INTEGER CHECK (ranking_score >= 0 AND ranking_score <= 100);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS urgency_score INTEGER CHECK (urgency_score >= 0 AND urgency_score <= 100);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS popularity_score INTEGER CHECK (popularity_score >= 0 AND popularity_score <= 100);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS funding_score INTEGER CHECK (funding_score >= 0 AND funding_score <= 100);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS career_impact_score INTEGER CHECK (career_impact_score >= 0 AND career_impact_score <= 100);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS eligibility_score INTEGER CHECK (eligibility_score >= 0 AND eligibility_score <= 100);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS success_probability INTEGER CHECK (success_probability >= 0 AND success_probability <= 100);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS save_count INTEGER DEFAULT 0;

-- Add new columns to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS plan_tier TEXT DEFAULT 'free' CHECK (plan_tier IN ('free', 'premium', 'premium_plus', 'enterprise'));
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS match_count INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS saved_count INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS application_count INTEGER DEFAULT 0;

-- Add new columns to user_matches
ALTER TABLE user_matches ADD COLUMN IF NOT EXISTS eligibility_score INTEGER CHECK (eligibility_score >= 0 AND eligibility_score <= 100);
ALTER TABLE user_matches ADD COLUMN IF NOT EXISTS success_probability INTEGER CHECK (success_probability >= 0 AND success_probability <= 100);

-- Add new columns to sources
ALTER TABLE sources ADD COLUMN IF NOT EXISTS freshness_score INTEGER DEFAULT 50;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS authority_score INTEGER DEFAULT 50;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS update_frequency_hours INTEGER DEFAULT 24;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS spam_risk INTEGER DEFAULT 10;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS duplicate_risk INTEGER DEFAULT 20;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS error_count INTEGER DEFAULT 0;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS collection_count INTEGER DEFAULT 0;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS collection_success_rate INTEGER DEFAULT 100;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS last_error_at TIMESTAMPTZ;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS last_error_message TEXT;

-- Add plan_tier to revenue_events
ALTER TABLE revenue_events ADD COLUMN IF NOT EXISTS plan_tier TEXT;

-- RLS for new tables
ALTER TABLE opportunity_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;

-- Public read for rankings
CREATE POLICY "Rankings public read" ON opportunity_rankings
  FOR SELECT USING (true);

-- Users read own documents
CREATE POLICY "Users read own documents" ON generated_documents
  FOR SELECT USING (auth.uid() = user_id);

-- Users create own documents
CREATE POLICY "Users create own documents" ON generated_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin access
CREATE POLICY "Admin full access rankings" ON opportunity_rankings
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin')
  );

CREATE POLICY "Admin full access source_health" ON source_health
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin')
  );
