-- Fursa AI Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================
-- ENUMS
-- ============================
CREATE TYPE opportunity_category AS ENUM (
  'scholarship', 'foreign_job', 'grant', 'tender', 'fellowship',
  'startup_funding', 'competition', 'internship', 'exchange_program'
);

CREATE TYPE opportunity_status AS ENUM ('pending', 'approved', 'rejected', 'expired', 'featured');
CREATE TYPE user_role AS ENUM ('user', 'premium', 'enterprise', 'admin');
CREATE TYPE agent_status AS ENUM ('idle', 'running', 'error', 'completed');
CREATE TYPE task_status AS ENUM ('pending', 'running', 'completed', 'failed');

-- ============================
-- SOURCES TABLE
-- ============================
CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  language TEXT DEFAULT 'en',
  region TEXT DEFAULT 'global',
  quality_score INTEGER DEFAULT 50 CHECK (quality_score >= 0 AND quality_score <= 100),
  is_active BOOLEAN DEFAULT true,
  last_crawled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sources_type ON sources(type);
CREATE INDEX idx_sources_active ON sources(is_active);
CREATE INDEX idx_sources_quality ON sources(quality_score DESC);

-- ============================
-- RAW OPPORTUNITIES TABLE
-- ============================
CREATE TABLE raw_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  external_id TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  url TEXT NOT NULL,
  deadline TIMESTAMPTZ,
  country TEXT,
  category opportunity_category,
  organization TEXT,
  eligibility TEXT,
  raw_html TEXT,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_raw_source ON raw_opportunities(source_id);
CREATE INDEX idx_raw_category ON raw_opportunities(category);
CREATE INDEX idx_raw_deadline ON raw_opportunities(deadline);

-- ============================
-- OPPORTUNITIES TABLE
-- ============================
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  summary TEXT,
  description TEXT NOT NULL,
  url TEXT NOT NULL,
  deadline TIMESTAMPTZ,
  country TEXT,
  category opportunity_category NOT NULL,
  organization TEXT,
  eligibility TEXT,
  benefits TEXT,
  required_documents TEXT[],
  application_link TEXT,
  deadline_urgency INTEGER,
  difficulty_score INTEGER CHECK (difficulty_score >= 0 AND difficulty_score <= 100),
  quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
  match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  tags TEXT[],
  status opportunity_status DEFAULT 'pending',
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  application_count INTEGER DEFAULT 0,
  title_sw TEXT,
  summary_sw TEXT,
  description_sw TEXT,
  social_copy TEXT,
  hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_opportunities_hash ON opportunities(hash) WHERE hash IS NOT NULL;
CREATE INDEX idx_opportunities_category ON opportunities(category);
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_opportunities_deadline ON opportunities(deadline);
CREATE INDEX idx_opportunities_country ON opportunities(country);
CREATE INDEX idx_opportunities_quality ON opportunities(quality_score DESC);
CREATE INDEX idx_opportunities_featured ON opportunities(is_featured) WHERE is_featured = true;
CREATE INDEX idx_opportunities_tags ON opportunities USING gin(tags);
CREATE INDEX idx_opportunities_search ON opportunities USING gin(
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(summary, ''))
);
CREATE INDEX idx_opportunities_created ON opportunities(created_at DESC);

-- ============================
-- USER PROFILES TABLE
-- ============================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'user',
  education_level TEXT,
  profession TEXT,
  country TEXT,
  interests TEXT[],
  industry TEXT,
  skills TEXT[],
  phone TEXT,
  whatsapp_subscribed BOOLEAN DEFAULT false,
  email_subscribed BOOLEAN DEFAULT true,
  push_subscribed BOOLEAN DEFAULT false,
  is_onboarded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_users_role ON user_profiles(role);
CREATE INDEX idx_users_country ON user_profiles(country);
CREATE INDEX idx_users_profession ON user_profiles(profession);
CREATE INDEX idx_users_interests ON user_profiles USING gin(interests);

-- ============================
-- USER MATCHES TABLE
-- ============================
CREATE TABLE user_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  match_score INTEGER NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  match_reasons TEXT[],
  is_viewed BOOLEAN DEFAULT false,
  is_saved BOOLEAN DEFAULT false,
  is_applied BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, opportunity_id)
);

CREATE INDEX idx_matches_user ON user_matches(user_id);
CREATE INDEX idx_matches_score ON user_matches(match_score DESC);
CREATE INDEX idx_matches_saved ON user_matches(user_id, is_saved) WHERE is_saved = true;

-- ============================
-- AGENT TASKS TABLE
-- ============================
CREATE TABLE agent_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_name TEXT NOT NULL,
  action TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  status task_status DEFAULT 'pending',
  result JSONB,
  error TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tasks_status ON agent_tasks(status);
CREATE INDEX idx_tasks_agent ON agent_tasks(agent_name);
CREATE INDEX idx_tasks_created ON agent_tasks(created_at DESC);

-- ============================
-- AI CACHE TABLE
-- ============================
CREATE TABLE ai_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_hash TEXT NOT NULL UNIQUE,
  response JSONB NOT NULL,
  model TEXT DEFAULT 'deepseek-v4',
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cache_hash ON ai_cache(prompt_hash);

-- ============================
-- SEO CONTENT TABLE
-- ============================
CREATE TABLE seo_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  h1 TEXT NOT NULL,
  content TEXT NOT NULL,
  category opportunity_category,
  country TEXT,
  tags TEXT[],
  canonical_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_seo_slug ON seo_content(slug);
CREATE INDEX idx_seo_category ON seo_content(category);

-- ============================
-- REVENUE EVENTS TABLE
-- ============================
CREATE TABLE revenue_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  stripe_event_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_revenue_user ON revenue_events(user_id);
CREATE INDEX idx_revenue_type ON revenue_events(event_type);
CREATE INDEX idx_revenue_created ON revenue_events(created_at DESC);

-- ============================
-- SUBSCRIPTIONS TABLE
-- ============================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- ============================
-- NOTIFICATIONS TABLE
-- ============================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  channel TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ,
  metadata JSONB
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- ============================
-- TRENDING TOPICS TABLE
-- ============================
CREATE TABLE trending_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic TEXT NOT NULL,
  category opportunity_category,
  country TEXT,
  score INTEGER DEFAULT 0,
  period TEXT DEFAULT 'weekly',
  generated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_trending_period ON trending_topics(period, score DESC);

-- ============================
-- BETA WAITLIST TABLE
-- ============================
CREATE TABLE beta_waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT,
  email TEXT NOT NULL,
  country TEXT,
  interest_category TEXT,
  source_page TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_beta_waitlist_country ON beta_waitlist(country);
CREATE INDEX idx_beta_waitlist_interest ON beta_waitlist(interest_category);
CREATE INDEX idx_beta_waitlist_created ON beta_waitlist(created_at DESC);

ALTER TABLE beta_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert beta waitlist" ON beta_waitlist
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin full access beta waitlist" ON beta_waitlist
  FOR ALL USING (auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin'));

-- ============================
-- BLOG POSTS TABLE
-- ============================
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  author TEXT DEFAULT 'Fursa AI',
  cover_image TEXT,
  tags TEXT[],
  is_published BOOLEAN DEFAULT false,
  is_generated BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_blog_slug ON blog_posts(slug);
CREATE INDEX idx_blog_published ON blog_posts(is_published, published_at DESC);

-- ============================
-- ROW LEVEL SECURITY
-- ============================
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Public read access for approved opportunities
CREATE POLICY "Opportunities public read" ON opportunities
  FOR SELECT USING (status = 'approved' OR status = 'featured');

-- Users can read their own profile
CREATE POLICY "Users read own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update own profile
CREATE POLICY "Users update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users read own matches
CREATE POLICY "Users read own matches" ON user_matches
  FOR SELECT USING (auth.uid() = user_id);

-- Users update own matches
CREATE POLICY "Users update own matches" ON user_matches
  FOR UPDATE USING (auth.uid() = user_id);

-- Users read own notifications
CREATE POLICY "Users read own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Admin full access
CREATE POLICY "Admin full access opportunities" ON opportunities
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin')
  );

-- ============================
-- TRIGGERS
-- ============================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sources_updated_at
  BEFORE UPDATE ON sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
