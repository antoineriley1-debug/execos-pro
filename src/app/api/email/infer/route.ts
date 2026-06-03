import { createClient } from '@supabase/supabase-js'
import { Anthropic } from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
})

interface EmailInferenceRequest {
  emailId: string
  siteId: string
  emailText: string
  senderEmail: string
}

interface EmailInferenceResponse {
  id: string
  senderIntent: string
  hiddenUrgency: boolean
  expectedResponse: string
  actualRequest: string
  actionItems: string[]
  missingInfo: string[]
  riskLevel: 'green' | 'yellow' | 'red'
  tone: 'professional' | 'casual' | 'frustrated' | 'demanding' | 'friendly' | 'neutral'
  deadlinePressure: string | null
  relatedSites: string[]
  relatedProjects: string[]
  relatedContracts: string[]
  actionRequired: 'none' | 'reply' | 'action' | 'escalation' | 'documentation'
  senderPatternMatch: string | null
  confidenceScore: number
}

/**
 * Analyze email with advanced AI inference
 * Extracts 13 inference points for deep email understanding
 */
export async function POST(request: Request) {
  try {
    const { emailId, siteId, emailText, senderEmail }: EmailInferenceRequest =
      await request.json()

    if (!emailId || !siteId || !emailText) {
      return Response.json(
        { error: 'Missing required fields: emailId, siteId, emailText' },
        { status: 400 }
      )
    }

    // Create the inference prompt for Claude
    const inferencePrompt = `You are an expert at analyzing emails and understanding communication patterns. 
    
Analyze this email and provide a detailed inference in JSON format:

EMAIL:
${emailText}

SENDER EMAIL: ${senderEmail}

Provide a JSON response with these exact fields (be specific and actionable):

{
  "senderIntent": "What is the sender actually trying to accomplish? (clear, concise)",
  "hiddenUrgency": boolean (true if urgent despite tone),
  "expectedResponse": "Does this need a reply? What kind? (or 'none')",
  "actualRequest": "Strip the words - what's the real underlying request?",
  "actionItems": ["explicit action 1", "implicit action 2", ...],
  "missingInfo": ["missing detail 1", "missing detail 2", ...],
  "riskLevel": "green|yellow|red (red = escalate)",
  "tone": "professional|casual|frustrated|demanding|friendly|neutral",
  "deadlinePressure": "null or timestamp/date when mentioned",
  "actionRequired": "none|reply|action|escalation|documentation",
  "confidenceScore": 0-100 (how confident in these inferences?)
}

Be analytical, not surface-level. Look for what's unsaid.`

    // Call Claude for inference
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: inferencePrompt,
        },
      ],
    })

    // Extract JSON from response
    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    let inferenceData
    try {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      inferenceData = JSON.parse(jsonMatch[0])
    } catch (e) {
      console.error('Failed to parse Claude response:', content.text)
      throw new Error('Failed to parse AI response')
    }

    // Get sender's historical patterns
    const { data: contactProfile } = await supabase
      .from('contact_profiles')
      .select('*')
      .eq('site_id', siteId)
      .eq('contact_email', senderEmail)
      .single()

    let senderPatternMatch = null
    if (contactProfile) {
      senderPatternMatch = `Contact pattern: ${contactProfile.communication_style} style, reliability: ${contactProfile.reliability_score}/100, usually ${contactProfile.urgency_pattern || 'mixed'}`
    }

    // Store inference in database
    const { data: inference, error } = await supabase
      .from('email_inferences')
      .insert({
        email_id: emailId,
        site_id: siteId,
        sender_intent: inferenceData.senderIntent,
        hidden_urgency: inferenceData.hiddenUrgency,
        expected_response: inferenceData.expectedResponse,
        actual_request: inferenceData.actualRequest,
        action_items: inferenceData.actionItems,
        missing_info: inferenceData.missingInfo,
        risk_level: inferenceData.riskLevel,
        tone: inferenceData.tone,
        deadline_pressure: inferenceData.deadlinePressure,
        related_sites: [],
        related_projects: [],
        related_contracts: [],
        action_required: inferenceData.actionRequired,
        sender_pattern_match: senderPatternMatch,
        confidence_score: inferenceData.confidenceScore,
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    // Update contact profile interaction count and reliability
    if (contactProfile) {
      await supabase
        .from('contact_profiles')
        .update({
          interaction_count: (contactProfile.interaction_count || 0) + 1,
          last_interacted_at: new Date().toISOString(),
        })
        .eq('id', contactProfile.id)
    }

    // Return structured response
    return Response.json({
      id: inference.id,
      senderIntent: inference.sender_intent,
      hiddenUrgency: inference.hidden_urgency,
      expectedResponse: inference.expected_response,
      actualRequest: inference.actual_request,
      actionItems: inference.action_items,
      missingInfo: inference.missing_info,
      riskLevel: inference.risk_level,
      tone: inference.tone,
      deadlinePressure: inference.deadline_pressure,
      relatedSites: inference.related_sites,
      relatedProjects: inference.related_projects,
      relatedContracts: inference.related_contracts,
      actionRequired: inference.action_required,
      senderPatternMatch: inference.sender_pattern_match,
      confidenceScore: inference.confidence_score,
    } as EmailInferenceResponse)
  } catch (error) {
    console.error('Email inference error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to infer email' },
      { status: 500 }
    )
  }
}
