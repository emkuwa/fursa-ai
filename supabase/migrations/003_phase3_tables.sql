-- Fursa AI Phase 3: Revenue Validation & Autonomous Growth

-- ANALYTICS EVENTS
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  session_id UUID,
  event_type TEXT NOT NULL CHECK (event_type IN ('view','click','save','unsave','search','share','alert_open','digest_open','referral_click','upgrade_prompt_view','upgrade_prompt_click')),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  category TEXT,
  country TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_analytics_event_type ON analytics_events(event_type, created_at DESC);
CREATE INDEX idx_analytics_user ON analytics_events(user_id, created_at DESC);
CREATE INDEX idx_analytics_category ON analytics_events(category, created_at DESC);
CREATE INDEX idx_analytics_date ON analytics_events(created_at);

-- SEARCH LOGS
CREATE TABLE IF NOT EXISTS search_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  query TEXT NOT NULL,
  category TEXT,
  country TEXT,
  result_count INTEGER DEFAULT 0,
  filters JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_search_logs_user ON search_logs(user_id, created_at DESC);
CREATE INDEX idx_search_logs_query ON search_logs(query);
CREATE INDEX idx_search_logs_date ON search_logs(created_at);

-- DAILY DIGESTS
CREATE TABLE IF NOT EXISTS daily_digests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  category TEXT NOT NULL,
  opportunities JSONB NOT NULL DEFAULT '[]',
  sent_via TEXT[] DEFAULT '{}',
  sent_to_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_digests_date ON daily_digests(date DESC);
CREATE INDEX idx_digests_category ON daily_digests(category, date);

-- REFERRALS
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  invitee_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  invitee_email TEXT,
  code TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','joined','converted','expired')),
  reward_earned DECIMAL(10,2) DEFAULT 0,
  reward_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  converted_at TIMESTAMPTZ
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_code ON referrals(code);
CREATE INDEX idx_referrals_status ON referrals(status);

-- RECOMMENDATIONS
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  reason TEXT,
  source_type TEXT CHECK (source_type IN ('search_history','saved_similar','profile_match','similar_users','trending')),
  is_dismissed BOOLEAN DEFAULT false,
  is_clicked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, opportunity_id)
);

CREATE INDEX idx_recommendations_user ON recommendations(user_id, score DESC);

-- UPGRADE LEADS
CREATE TABLE IF NOT EXISTS upgrade_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  signals TEXT[] DEFAULT '{}',
  plan_tier TEXT DEFAULT 'premium',
  stage TEXT DEFAULT 'cold' CHECK (stage IN ('cold','warm','hot')),
  prompted_at TIMESTAMPTZ,
  prompt_count INTEGER DEFAULT 0,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX idx_upgrade_leads_score ON upgrade_leads(score DESC);
CREATE INDEX idx_upgrade_leads_stage ON upgrade_leads(stage);

-- BETA WAITLIST
CREATE TABLE IF NOT EXISTS beta_waitlist (
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

-- Add referral_code to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS reward_balance DECIMAL(10,2) DEFAULT 0;

-- Add columns to opportunities for analytics
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS alert_sent_count INTEGER DEFAULT 0;

-- RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_digests ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE upgrade_leads ENABLE ROW LEVEL SECURITY;

-- Public can read digests
CREATE POLICY "Digests public read" ON daily_digests FOR SELECT USING (true);

-- Users read own events
CREATE POLICY "Users read own analytics" ON analytics_events
  FOR SELECT USING (auth.uid() = user_id);

-- Users insert own analytics
CREATE POLICY "Users insert analytics" ON analytics_events
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users read own searches
CREATE POLICY "Users read own searches" ON search_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Users read own referrals
CREATE POLICY "Users read own referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id);

-- Users read own recommendations
CREATE POLICY "Users read own recommendations" ON recommendations
  FOR SELECT USING (auth.uid() = user_id);

-- Admin full access
CREATE POLICY "Admin full access analytics" ON analytics_events
  FOR ALL USING (auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin'));
CREATE POLICY "Admin full access search_logs" ON search_logs
  FOR ALL USING (auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin'));
CREATE POLICY "Admin full access referrals" ON referrals
  FOR ALL USING (auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin'));
CREATE POLICY "Admin full access recommendations" ON recommendations
  FOR ALL USING (auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin'));
CREATE POLICY "Admin full access upgrade_leads" ON upgrade_leads
  FOR ALL USING (auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin'));
