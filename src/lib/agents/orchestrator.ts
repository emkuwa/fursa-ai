import { SourceDiscoveryAgent } from './source-discovery'
import { OpportunityCollectionAgent } from './opportunity-collection'
import { DeduplicationAgent } from './deduplication'
import { OpportunityAnalysisAgent } from './opportunity-analysis'
import { OpportunityRankingAgent } from './opportunity-ranking'
import { CategorizationAgent } from './categorization'
import { TranslationAgent } from './translation'
import { UserMatchingAgent } from './user-matching'
import { AlertAgent } from './alert'
import { ContentMarketingAgent } from './content-marketing'
import { SEOAgent } from './seo'
import { TrendPredictionAgent } from './trend-analysis'
import { RevenueAgent } from './revenue'
import { ApplicationAssistantAgent } from './application-assistant'
import { QualityControlAgent } from './quality-control'
import { AdminCopilotAgent } from './admin-copilot'
import { AnalyticsAgent } from './analytics'
import { RecommendationAgent } from './recommendation'
import { ReferralAgent } from './referral'
import { PremiumConversionAgent } from './premium-conversion'
import { DailyDigestAgent } from './daily-digest'
import { FreshnessAgent } from './freshness'
import { OpportunityMapAgent } from './opportunity-map'
import { BaseAgent } from './base-agent'

const agentRegistry: Record<string, BaseAgent> = {
  source_discovery: new SourceDiscoveryAgent(),
  opportunity_collection: new OpportunityCollectionAgent(),
  deduplication: new DeduplicationAgent(),
  opportunity_analysis: new OpportunityAnalysisAgent(),
  opportunity_ranking: new OpportunityRankingAgent(),
  categorization: new CategorizationAgent(),
  translation: new TranslationAgent(),
  user_matching: new UserMatchingAgent(),
  alert: new AlertAgent(),
  content_marketing: new ContentMarketingAgent(),
  seo: new SEOAgent(),
  trend_analysis: new TrendPredictionAgent(),
  revenue: new RevenueAgent(),
  application_assistant: new ApplicationAssistantAgent(),
  quality_control: new QualityControlAgent(),
  admin_copilot: new AdminCopilotAgent(),
  analytics: new AnalyticsAgent(),
  recommendation: new RecommendationAgent(),
  referral: new ReferralAgent(),
  premium_conversion: new PremiumConversionAgent(),
  daily_digest: new DailyDigestAgent(),
  freshness: new FreshnessAgent(),
  opportunity_map: new OpportunityMapAgent(),
}

export async function runAgent(agentName: string, action: string, payload?: Record<string, unknown>) {
  const agent = agentRegistry[agentName]
  if (!agent) {
    return { success: false, message: `Unknown agent: ${agentName}` }
  }
  return agent.run(action, payload)
}

export async function runFullPipeline() {
  const results = []

  // Phase 1: Discovery & Collection (Every 4 hours)
  results.push(await runAgent('source_discovery', 'health-check'))
  results.push(await runAgent('source_discovery', 'score'))
  results.push(await runAgent('source_discovery', 'cleanup'))
  results.push(await runAgent('opportunity_collection', 'collect'))
  results.push(await runAgent('opportunity_collection', 'promote'))

  // Phase 2: Processing & Dedup
  results.push(await runAgent('deduplication', 'deduplicate'))
  results.push(await runAgent('categorization', 'categorize'))

  // Phase 3: Analysis & Ranking
  results.push(await runAgent('opportunity_analysis', 'analyze'))
  results.push(await runAgent('opportunity_ranking', 'rank-all'))

  // Phase 4: Enhancement
  results.push(await runAgent('translation', 'translate'))
  results.push(await runAgent('quality_control', 'audit'))
  results.push(await runAgent('quality_control', 'approve'))

  // Phase 5: Distribution & Matching
  results.push(await runAgent('user_matching', 'match-all'))
  results.push(await runAgent('alert', 'daily-digest'))

  // Phase 6: Growth & SEO
  results.push(await runAgent('content_marketing', 'generate-all'))
  results.push(await runAgent('seo', 'generate-all'))
  results.push(await runAgent('trend_analysis', 'analyze'))

  // Phase 7: Business
  results.push(await runAgent('revenue', 'track'))
  results.push(await runAgent('revenue', 'sync-subscriptions'))

  // Phase 8: Reporting
  results.push(await runAgent('admin_copilot', 'daily-report'))

  // Phase 9: Growth & Revenue Validation
  results.push(await runAgent('analytics', 'daily-report'))
  results.push(await runAgent('recommendation', 'recommend-all'))
  results.push(await runAgent('premium_conversion', 'score-users'))
  results.push(await runAgent('premium_conversion', 'generate-prompts'))
  results.push(await runAgent('daily_digest', 'generate-and-send'))

  // Phase 10: Data Moat & Quality
  results.push(await runAgent('freshness', 'score-all'))
  results.push(await runAgent('freshness', 'archive-expired'))
  results.push(await runAgent('freshness', 'detect-stale'))
  results.push(await runAgent('opportunity_map', 'country-intelligence'))
  results.push(await runAgent('trend_analysis', 'analyze'))

  return results
}

export function getAgent(name: string): BaseAgent | undefined {
  return agentRegistry[name]
}

export function listAgents(): string[] {
  return Object.keys(agentRegistry)
}

export { agentRegistry }
