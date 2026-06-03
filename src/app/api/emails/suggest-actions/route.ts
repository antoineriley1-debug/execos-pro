// API Route: POST /api/emails/[id]/suggest-actions
// Generate AI-suggested actions based on email analysis

import { createClient } from '@supabase/supabase-js'
import { Anthropic } from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
})

interface SuggestActionsRequest {
  emailId: string
  siteId: string
}

/**
 * Analyze email and suggest smart actions
 * Uses email analysis to determine what user should do
 */
export async function POST(request: Request) {
  try {
    const { emailId, siteId }: SuggestActionsRequest = await request.json()

    if (!emailId || !siteId) {
      return Response.json(
        { error: 'Missing emailId or siteId' },
        { status: 400 }
      )
    }

    // Get email and analysis
    const { data: email, error: emailError } = await supabase
      .from('emails')
      .select('*')
      .eq('id', emailId)
      .single()

    if (emailError || !email) {
      return Response.json({ error: 'Email not found' }, { status: 404 })
    }

    const { data: analysis } = await supabase
      .from('email_inferences')
      .select('*')
      .eq('email_id', emailId)
      .single()

    if (!analysis) {
      return Response.json(
        { error: 'Email has not been analyzed' },
        { status: 400 }
      )
    }

    // Get related projects and contracts for this site
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name')
      .eq('site_id', siteId)
      .limit(10)

    const { data: contracts } = await supabase
      .from('contracts')
      .select('id, contract_name')
      .eq('site_id', siteId)
      .limit(10)

    // Use Claude to generate smart action suggestions
    const suggestionPrompt = `You are an intelligent assistant that suggests actions for emails.

EMAIL DETAILS:
Subject: ${email.subject}
From: ${email.sender_email}
Body: ${email.body_text?.substring(0, 500)}...

EMAIL ANALYSIS:
Intent: ${analysis.sender_intent}
Risk Level: ${analysis.risk_level}
Tone: ${analysis.tone}
Action Items: ${analysis.action_items?.join(', ')}
Deadline: ${analysis.deadline_pressure || 'None'}
Requires Response: ${analysis.expected_response}

AVAILABLE RESOURCES:
Projects: ${projects?.map((p: any) => p.name).join(', ') || 'None'}
Contracts: ${contracts?.map((c: any) => c.contract_name).join(', ') || 'None'}

Generate 6-8 smart action suggestions in JSON format. For each suggestion:
1. action_type: One of: draft_response, draft_escalation, draft_summary, create_task, link_project, add_contact, schedule_followup, flag_compliance, escalate_risk
2. suggestion_text: Clear action description
3. reasoning: Why this action is suggested
4. confidence_score: 0-100 (how confident this is the right action)
5. priority: 1-10 (1=highest priority)
6. suggestion_group: response_options, task_options, project_options, contact_options, etc.

RULES:
- If risk_level is 'red': MUST include 'escalate_risk' action
- If deadline mentioned: MUST include 'create_task' action
- If new contact (not previously seen): MUST include 'add_contact' action
- If unresponsive vendor pattern: MUST include 'schedule_followup' action
- If compliance/policy issue: MUST include 'flag_compliance' action
- Always include response option (firm, friendly, or escalation based on tone)

Return ONLY a JSON array of suggestions, no other text.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: suggestionPrompt,
        },
      ],
    })

    // Parse suggestions
    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    let suggestions
    try {
      const jsonMatch = content.text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error('No JSON array found in response')
      }
      suggestions = JSON.parse(jsonMatch[0])
    } catch (e) {
      console.error('Failed to parse suggestions:', content.text)
      throw new Error('Failed to parse action suggestions')
    }

    // Store suggestions in database
    const suggestionRecords = suggestions.map((sugg: any) => ({
      user_id: email.user_id,
      email_id: emailId,
      action_type: sugg.action_type,
      suggestion_text: sugg.suggestion_text,
      reasoning: sugg.reasoning,
      confidence_score: sugg.confidence_score,
      priority: sugg.priority,
      suggestion_group: sugg.suggestion_group,
      dismissed: false,
      executed: false,
    }))

    const { error: storeError } = await supabase
      .from('email_action_suggestions')
      .insert(suggestionRecords)
      .select()

    if (storeError) {
      console.error('Error storing suggestions:', storeError)
    }

    // Determine primary suggested action (highest confidence, lowest priority)
    const primarySuggestion = suggestions.reduce((best: any, current: any) =>
      current.confidence_score > best.confidence_score && current.priority < best.priority
        ? current
        : best
    )

    // Group suggestions
    const groupedSuggestions = suggestions.reduce((groups: any, sugg: any) => {
      if (!groups[sugg.suggestion_group]) {
        groups[sugg.suggestion_group] = []
      }
      groups[sugg.suggestion_group].push(sugg)
      return groups
    }, {})

    return Response.json({
      emailId,
      suggestions: suggestions,
      groupedSuggestions,
      primarySuggestion,
      totalSuggestions: suggestions.length,
      riskLevel: analysis.risk_level,
      requiresResponse: analysis.expected_response !== 'none',
      hasDeadline: !!analysis.deadline_pressure,
    })
  } catch (error) {
    console.error('Suggest actions error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to suggest actions' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/emails/[id]/suggest-actions?emailId=xxx
 * Retrieve existing suggestions for an email
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const emailId = searchParams.get('emailId')

    if (!emailId) {
      return Response.json({ error: 'Missing emailId' }, { status: 400 })
    }

    const { data: suggestions, error } = await supabase
      .from('email_action_suggestions')
      .select('*')
      .eq('email_id', emailId)
      .eq('dismissed', false)
      .order('priority', { ascending: true })
      .order('confidence_score', { ascending: false })

    if (error) {
      throw error
    }

    // Group suggestions
    const groupedSuggestions = suggestions.reduce((groups: any, sugg: any) => {
      if (!groups[sugg.suggestion_group]) {
        groups[sugg.suggestion_group] = []
      }
      groups[sugg.suggestion_group].push(sugg)
      return groups
    }, {})

    return Response.json({
      suggestions,
      groupedSuggestions,
      totalSuggestions: suggestions.length,
    })
  } catch (error) {
    console.error('Error retrieving suggestions:', error)
    return Response.json(
      { error: 'Failed to retrieve suggestions' },
      { status: 500 }
    )
  }
}
