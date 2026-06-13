import { BaseAgent, type AgentResult } from './base-agent'
import { callAI } from '@/lib/ai/client'

export class ContentMarketingAgent extends BaseAgent {
  constructor() {
    super('content_marketing', 2)
  }

  async execute(action: string, payload?: Record<string, unknown>): Promise<AgentResult> {
    switch (action) {
      case 'generate-social':
        return this.generateSocialPosts()
      case 'generate-blog':
        return this.generateBlogPost()
      case 'generate-all':
        return this.generateAll()
      default:
        return { success: false, message: `Unknown action: ${action}` }
    }
  }

  private async generateSocialPosts(): Promise<AgentResult> {
    const { data: topOpportunities } = await this.supabase
      .from('opportunities')
      .select('id, title, summary, category, country, deadline, quality_score, url')
      .in('status', ['approved', 'featured'])
      .gte('quality_score', 75)
      .order('quality_score', { ascending: false })
      .limit(5)

    if (!topOpportunities?.length) return { success: true, message: 'No top opportunities' }

    let posts = 0
    for (const opp of topOpportunities) {
      const content = await this.generatePostContent(opp)
      if (content) {
        await this.saveToBlog(content, opp)
        posts++
      }
    }

    return { success: true, message: `Generated ${posts} social posts` }
  }

  private async generateBlogPost(): Promise<AgentResult> {
    const prompt = `Write a blog post about opportunities for African students and professionals.
Focus on: top scholarships, international jobs, and funding available right now.
Make it inspiring, actionable, and SEO-optimized. Include stats and practical tips.
Title should be compelling. Return as JSON with title, excerpt, content.`

    const result = await callAI(prompt, 'marketing', { maxTokens: 3000 })

    if (!result) return { success: false, message: 'Blog generation failed' }

    return { success: true, message: 'Blog post generated', data: { content: result.content } as unknown as Record<string, unknown> }
  }

  private async generateAll(): Promise<AgentResult> {
    const social = await this.generateSocialPosts()
    const blog = await this.generateBlogPost()
    return {
      success: true,
      message: `Social: ${social.message}, Blog: ${blog.message}`,
    }
  }

  private async generatePostContent(opportunity: {
    title: string
    summary?: string | null
    category: string
    country?: string | null
    deadline?: string | null
    url: string
  }): Promise<string | null> {
    const prompt = `Create social media posts for this opportunity:
Title: ${opportunity.title}
Summary: ${opportunity.summary || ''}
Category: ${opportunity.category}
Country: ${opportunity.country || 'Various'}
Deadline: ${opportunity.deadline ? new Date(opportunity.deadline).toLocaleDateString() : 'Open'}
URL: ${opportunity.url}

Create 4 posts:
1. Facebook (2-3 paragraphs, inspirational)
2. Instagram (short, visual, with hashtags)
3. LinkedIn (professional, detailed)
4. X/Twitter (under 280 chars)

Return as JSON with platform as key.`

    const result = await callAI(prompt, 'marketing')
    return result.content
  }

  private async saveToBlog(content: string, opportunity: { title: string; category: string; url: string }): Promise<void> {
    try {
      const parsed = JSON.parse(content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())
      await this.supabase.from('blog_posts').insert({
        title: `Opportunity Spotlight: ${opportunity.title}`,
        slug: `opportunity-spotlight-${opportunity.title.toLowerCase().replace(/\s+/g, '-').slice(0, 80)}`,
        excerpt: `Check out this amazing ${opportunity.category.replace('_', ' ')} opportunity!`,
        content: JSON.stringify(parsed),
        tags: [opportunity.category, 'opportunity', 'spotlight'],
        is_published: true,
        is_generated: true,
        published_at: new Date().toISOString(),
      })
    } catch {
      await this.log('Failed to parse and save blog content', 'error')
    }
  }
}
