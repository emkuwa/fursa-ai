export type OpportunityCategory =
  | 'scholarship'
  | 'foreign_job'
  | 'grant'
  | 'tender'
  | 'fellowship'
  | 'startup_funding'
  | 'competition'
  | 'internship'
  | 'exchange_program'

export type OpportunityStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'featured'
export type UserRole = 'user' | 'premium' | 'premium_plus' | 'enterprise' | 'admin'
export type AlertChannel = 'whatsapp' | 'email' | 'push'
export type AgentStatus = 'idle' | 'running' | 'error' | 'completed'
export type PlanTier = 'free' | 'premium' | 'premium_plus' | 'enterprise'

export interface Source {
  id: string
  url: string
  name: string
  type: OpportunityCategory | 'general'
  language: string
  region: string
  quality_score: number
  freshness_score: number
  authority_score: number
  update_frequency_hours: number
  spam_risk: number
  duplicate_risk: number
  is_active: boolean
  error_count: number
  collection_count: number
  collection_success_rate: number
  last_crawled_at: string | null
  last_error_at: string | null
  last_error_message: string | null
  created_at: string
  updated_at: string
}

export interface RawOpportunity {
  id: string
  source_id: string
  external_id: string | null
  title: string
  description: string
  url: string
  deadline: string | null
  country: string | null
  category: OpportunityCategory | null
  organization: string | null
  eligibility: string | null
  raw_html: string | null
  fetched_at: string
  hash: string
  created_at: string
}

export interface Opportunity {
  id: string
  source_id: string
  title: string
  summary: string | null
  description: string
  url: string
  deadline: string | null
  country: string | null
  category: OpportunityCategory
  organization: string | null
  eligibility: string | null
  benefits: string | null
  required_documents: string[] | null
  application_link: string | null
  deadline_urgency: number | null
  difficulty_score: number | null
  quality_score: number | null
  match_score: number | null
  ranking_score: number | null
  urgency_score: number | null
  popularity_score: number | null
  funding_score: number | null
  career_impact_score: number | null
  eligibility_score: number | null
  success_probability: number | null
  tags: string[] | null
  status: OpportunityStatus
  is_featured: boolean
  view_count: number
  application_count: number
  save_count: number
  title_sw: string | null
  summary_sw: string | null
  description_sw: string | null
  social_copy: string | null
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  plan_tier: PlanTier
  education_level: string | null
  profession: string | null
  country: string | null
  interests: string[] | null
  industry: string | null
  skills: string[] | null
  experience_years: number | null
  phone: string | null
  whatsapp_subscribed: boolean
  email_subscribed: boolean
  push_subscribed: boolean
  is_onboarded: boolean
  match_count: number
  saved_count: number
  application_count: number
  created_at: string
  updated_at: string
}

export interface UserMatch {
  id: string
  user_id: string
  opportunity_id: string
  match_score: number
  eligibility_score: number | null
  difficulty_score: number | null
  success_probability: number | null
  match_reasons: string[] | null
  is_viewed: boolean
  is_saved: boolean
  is_applied: boolean
  created_at: string
}

export interface OpportunityRanking {
  id: string
  opportunity_id: string
  ranking_date: string
  category: OpportunityCategory
  rank: number
  ranking_score: number
  urgency_score: number
  popularity_score: number
  funding_score: number
  career_impact_score: number
  created_at: string
}

export interface SourceHealth {
  id: string
  source_id: string
  status: 'healthy' | 'degraded' | 'dead'
  error_rate_24h: number
  collection_count_24h: number
  success_rate_24h: number
  avg_response_time_ms: number
  last_error: string | null
  checked_at: string
}

export interface AgentTask {
  id: string
  agent_name: string
  action: string
  payload: Record<string, unknown>
  status: 'pending' | 'running' | 'completed' | 'failed'
  result: Record<string, unknown> | null
  error: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export interface AgentConfig {
  name: string
  description: string
  cron_schedule: string
  is_active: boolean
  max_retries: number
  timeout_seconds: number
  queue_name?: string | null
}

export interface AICache {
  id: string
  prompt_hash: string
  response: Record<string, unknown>
  model: string
  tokens_used: number
  created_at: string
}

export interface SEOContent {
  id: string
  slug: string
  title: string
  meta_description: string
  h1: string
  content: string
  category: OpportunityCategory | null
  country: string | null
  tags: string[] | null
  canonical_url: string | null
  word_count: number
  is_indexed: boolean
  created_at: string
  updated_at: string
}

export interface RevenueEvent {
  id: string
  user_id: string
  event_type: 'subscription_created' | 'subscription_renewed' | 'subscription_cancelled' | 'subscription_updated' | 'featured_listing' | 'sponsored' | 'ad_impression' | 'ad_click'
  amount: number
  currency: string
  plan_tier: PlanTier | null
  stripe_event_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  plan: PlanTier
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  status: 'active' | 'past_due' | 'cancelled' | 'expired' | 'trialing'
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  trial_end: string | null
  created_at: string
  updated_at: string
}

export interface AnalyticsEvent {
  id: string
  user_id: string | null
  session_id: string | null
  event_type: 'view' | 'click' | 'save' | 'unsave' | 'search' | 'share' | 'alert_open' | 'digest_open' | 'referral_click' | 'upgrade_prompt_view' | 'upgrade_prompt_click'
  opportunity_id: string | null
  category: OpportunityCategory | null
  country: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface SearchLog {
  id: string
  user_id: string | null
  query: string
  category: OpportunityCategory | null
  country: string | null
  result_count: number
  filters: Record<string, unknown> | null
  created_at: string
}

export interface DailyDigest {
  id: string
  date: string
  category: OpportunityCategory
  opportunities: { id: string; title: string; url: string; score: number }[]
  sent_via: string[]
  sent_to_count: number
  created_at: string
}

export interface Referral {
  id: string
  referrer_id: string
  invitee_id: string | null
  invitee_email: string | null
  code: string
  status: 'pending' | 'joined' | 'converted' | 'expired'
  reward_earned: number
  reward_type: string | null
  created_at: string
  converted_at: string | null
}

export interface Recommendation {
  id: string
  user_id: string
  opportunity_id: string
  score: number
  reason: string
  source_type: 'search_history' | 'saved_similar' | 'profile_match' | 'similar_users' | 'trending'
  is_dismissed: boolean
  created_at: string
}

export interface CategoryPerformance {
  category: OpportunityCategory
  views: number
  saves: number
  clicks: number
  applications: number
  alerts_opened: number
  premium_conversions: number
  revenue: number
  revenue_trend: number
  views_trend: number
  saves_trend: number
}

export interface SuccessMetrics {
  daily_active_users: number
  weekly_active_users: number
  monthly_active_users: number
  conversion_rate: number
  referral_growth: number
  premium_revenue: number
  opportunity_engagement: number
  total_users: number
  premium_users: number
  dau_wau_ratio: number
  wau_mau_ratio: number
}

export interface UpgradeLead {
  id: string
  user_id: string
  score: number
  signals: string[]
  plan_tier: PlanTier
  stage: 'cold' | 'warm' | 'hot'
  prompted_at: string | null
  prompt_count: number
  converted_at: string | null
  created_at: string
}

export interface DashboardStats {
  total_opportunities: number
  opportunities_by_category: Record<string, number>
  opportunities_today: number
  active_users: number
  new_users_today: number
  total_matches: number
  avg_match_score: number
  revenue_mtd: number
  revenue_today: number
  active_agents: number
  agent_errors: number
  source_health: { healthy: number; degraded: number; dead: number }
  total_saved: number
  total_applications: number
  rankings_today: number
  daily_digests: number
  referral_count: number
  conversion_rate: number
  dau: number
  wau: number
  mau: number
  category_performance: CategoryPerformance[]
  success_metrics: SuccessMetrics
}

export interface SourceRegistryEntry {
  url: string
  name: string
  type: 'scholarship' | 'foreign_job' | 'grant' | 'tender' | 'fellowship' | 'competition' | 'startup_funding' | 'internship' | 'exchange_program'
  region: string
  frequency: number
  quality: number
}

export interface SearchFilters {
  query?: string
  category?: OpportunityCategory
  country?: string
  deadline_before?: string
  deadline_after?: string
  min_quality_score?: number
  min_ranking_score?: number
  tags?: string[]
  page?: number
  limit?: number
  sort_by?: 'deadline' | 'quality_score' | 'ranking_score' | 'created_at' | 'match_score' | 'popularity_score'
  sort_order?: 'asc' | 'desc'
}

export interface WhatsAppMessage {
  from: string
  body: string
  messageId: string
  timestamp: string
}

export interface WhatsAppResponse {
  text: string
  interactive?: {
    type: 'button' | 'list'
    buttons?: { id: string; title: string }[]
    listItems?: { id: string; title: string; description?: string }[]
  }
}

export interface QueueJob {
  id: string
  queue: string
  agent_name: string
  action: string
  payload: Record<string, unknown>
  priority: number
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'retrying'
  retry_count: number
  max_retries: number
  scheduled_at: string | null
  started_at: string | null
  completed_at: string | null
  error: string | null
  created_at: string
}

export interface GeneratedDocument {
  id: string
  user_id: string
  type: 'cv' | 'cover_letter' | 'essay' | 'motivation_letter' | 'grant_concept' | 'personal_statement'
  opportunity_id: string | null
  title: string
  content: string
  quality_score: number | null
  suggestions: string[] | null
  is_template: boolean
  created_at: string
}
