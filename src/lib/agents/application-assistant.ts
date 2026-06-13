import { BaseAgent, type AgentResult } from './base-agent'
import { callAI } from '@/lib/ai/client'

const DOCUMENT_TEMPLATES: Record<string, string> = {
  cover_letter: `Write a professional cover letter for {opportunity_title} at {organization}.

{user_background}

Structure:
1. Opening paragraph - position applied for and enthusiasm
2. Body - relevant experience and skills
3. Why this opportunity matters for career
4. Closing - call to action

Make it ATS-optimized and under 400 words.`,

  essay: `Write a compelling scholarship essay for {opportunity_title}.

Prompt: {essay_prompt}
Applicant background: {user_background}

Structure:
1. Hook - personal story or insight
2. Academic/professional journey
3. Why this opportunity is crucial
4. Future impact and goals

{word_count} words. Be authentic and impactful.`,

  motivation_letter: `Write a motivation letter for {opportunity_title} at {organization}.

{user_background}

Focus on:
1. Why you're applying
2. What makes you unique
3. How you'll contribute
4. Long-term vision

Professional tone, under 500 words.`,

  grant_concept: `Write a grant concept note for:

Project: {project_title}
Organization: {user_background}
Problem: {problem_statement}
Budget: {budget}

Include:
1. Executive Summary (100 words)
2. Problem Statement
3. Project Objectives
4. Methodology
5. Expected Outcomes
6. Budget Overview
7. Sustainability Plan

Professional, clear, funder-focused.`,

  personal_statement: `Write a personal statement for {opportunity_title}.

Background: {user_background}

Include:
1. Your journey and motivation
2. Key achievements and experiences
3. Career goals and aspirations
4. Why you're a perfect fit

Authentic, compelling, under 700 words.`,

  cv_improvement: `Analyze and improve this CV/resume for {target_role}:

Current CV: {cv_content}

Provide:
1. Overall rating (0-100)
2. Key strengths
3. Specific improvements needed
4. Missing keywords for ATS
5. Suggested bullet point rewrites
6. Skills to add/emphasize
7. Format recommendations

Return as structured JSON.`,
}

export class ApplicationAssistantAgent extends BaseAgent {
  constructor() {
    super('application_assistant', 3)
  }

  async execute(action: string, payload?: Record<string, unknown>): Promise<AgentResult> {
    switch (action) {
      case 'generate':
        return this.generateDocument(payload)
      case 'improve-cv':
        return this.improveCV(payload)
      case 'rate-quality':
        return this.rateDocumentQuality(payload?.documentId as string)
      case 'list-templates':
        return this.listTemplates()
      default:
        return { success: false, message: `Unknown action: ${action}` }
    }
  }

  private async generateDocument(payload?: Record<string, unknown>): Promise<AgentResult> {
    const docType = payload?.type as string || 'cover_letter'
    const opportunityId = payload?.opportunityId as string
    const userId = payload?.userId as string

    let opportunity: any = { title: 'the opportunity', organization: '' }
    let user: any = { full_name: 'Applicant', email: '' }

    if (opportunityId) {
      const { data: opp } = await this.supabase
        .from('opportunities')
        .select('title, organization, description')
        .eq('id', opportunityId)
        .single()
      if (opp) opportunity = opp
    }

    if (userId) {
      const { data: profile } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (profile) user = profile
    }

    const template = DOCUMENT_TEMPLATES[docType]
    if (!template) return { success: false, message: `Unknown document type: ${docType}` }

    const prompt = template
      .replace(/{opportunity_title}/g, opportunity.title)
      .replace(/{organization}/g, opportunity.organization)
      .replace(/{user_background}/g, this.buildUserBackground(user))
      .replace(/{essay_prompt}/g, (payload?.essayPrompt as string) || 'Describe your background and aspirations')
      .replace(/{word_count}/g, String(payload?.wordCount || 500))
      .replace(/{project_title}/g, (payload?.projectTitle as string) || 'Project')
      .replace(/{problem_statement}/g, (payload?.problemStatement as string) || 'Community need')
      .replace(/{budget}/g, (payload?.budget as string) || 'To be determined')
      .replace(/{target_role}/g, (payload?.targetRole as string) || opportunity.title)
      .replace(/{cv_content}/g, (payload?.cvContent as string) || 'No CV provided')

    const result = await callAI(prompt, 'application', { maxTokens: 3000 })

    // Store generated document
    await this.supabase.from('generated_documents').insert({
      user_id: userId || 'system',
      type: docType,
      opportunity_id: opportunityId,
      title: `${docType.replace('_', ' ')} for ${opportunity.title}`,
      content: result.content,
      is_template: false,
    }).maybeSingle()

    return {
      success: true,
      message: `${docType.replace('_', ' ')} generated successfully`,
      data: { content: result.content, type: docType },
    }
  }

  private async improveCV(payload?: Record<string, unknown>): Promise<AgentResult> {
    const result = await this.generateDocument({ ...payload, type: 'cv_improvement' })
    return result
  }

  private async rateDocumentQuality(documentId?: string): Promise<AgentResult> {
    if (!documentId) return { success: false, message: 'No document ID' }

    const { data: doc } = await this.supabase
      .from('generated_documents')
      .select('content, type')
      .eq('id', documentId)
      .single()

    if (!doc) return { success: false, message: 'Document not found' }

    const prompt = `Rate this ${doc.type.replace('_', ' ')} document quality (0-100):

${doc.content.slice(0, 2000)}

Return JSON:
{
  "quality_score": 78,
  "strengths": ["Strong opening", "Clear structure"],
  "improvements": ["Add more quantifiable achievements", "Tighten conclusion"],
  "ats_score": 65
}`

    const result = await callAI(prompt, 'application')
    let parsed: any
    try {
      parsed = JSON.parse(result.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())
    } catch {
      parsed = { quality_score: 50, strengths: [], improvements: [] }
    }

    await this.supabase
      .from('generated_documents')
      .update({
        quality_score: parsed.quality_score,
        suggestions: parsed.improvements,
      })
      .eq('id', documentId)

    return { success: true, message: `Quality score: ${parsed.quality_score}/100`, data: parsed }
  }

  private async listTemplates(): Promise<AgentResult> {
    const templates = Object.entries(DOCUMENT_TEMPLATES).map(([key, value]) => ({
      type: key,
      name: key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      description: value.slice(0, 100) + '...',
    }))

    return { success: true, message: `${templates.length} templates available`, data: { templates } }
  }

  private buildUserBackground(user: any): string {
    const parts: string[] = []
    if (user.full_name) parts.push(`Name: ${user.full_name}`)
    if (user.education_level) parts.push(`Education: ${user.education_level}`)
    if (user.profession) parts.push(`Profession: ${user.profession}`)
    if (user.skills?.length) parts.push(`Skills: ${user.skills.join(', ')}`)
    if (user.experience_years) parts.push(`Experience: ${user.experience_years} years`)
    if (user.industry) parts.push(`Industry: ${user.industry}`)
    return parts.join('\n') || 'Professional with relevant background'
  }
}
