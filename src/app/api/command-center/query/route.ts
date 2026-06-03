import { createClient } from '@supabase/supabase-js'
import { Anthropic } from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
})

interface CommandCenterQuery {
  siteId: string
  userId: string
  query: string
}

/**
 * Natural language command center queries
 * Examples:
 * - "What needs my attention today?"
 * - "Which emails are waiting on replies?"
 * - "What's the status of Project X?"
 * - "Which vendors haven't responded?"
 */
export async function POST(request: Request) {
  try {
    const { siteId, userId, query }: CommandCenterQuery = await request.json()

    if (!siteId || !userId || !query) {
      return Response.json(
        { error: 'Missing required fields: siteId, userId, query' },
        { status: 400 }
      )
    }

    // Fetch all relevant data from the database
    const [
      { data: emails },
      { data: projects },
      { data: actionItems },
      { data: contracts },
      { data: recommendations },
      { data: calendarEvents },
    ] = await Promise.all([
      supabase.from('emails').select('*').eq('site_id', siteId).limit(50),
      supabase.from('projects').select('*').eq('site_id', siteId),
      supabase
        .from('action_items')
        .select('*')
        .eq('site_id', siteId)
        .neq('status', 'completed'),
      supabase.from('contracts').select('*').eq('site_id', siteId),
      supabase
        .from('workflow_recommendations')
        .select('*')
        .eq('site_id', siteId)
        .eq('user_id', userId)
        .eq('status', 'pending'),
      supabase
        .from('calendar_events')
        .select('*')
        .eq('site_id', siteId)
        .eq('user_id', userId)
        .gte('start_datetime', new Date().toISOString())
        .limit(20),
    ])

    // Build context for Claude
    const context = `
You are an intelligent operations assistant for a business management platform. 
You have access to the following data about the user's operations:

EMAILS (Recent):
${JSON.stringify(emails?.slice(0, 10), null, 2)}

PROJECTS:
${JSON.stringify(projects, null, 2)}

OPEN ACTION ITEMS:
${JSON.stringify(actionItems, null, 2)}

CONTRACTS:
${JSON.stringify(contracts, null, 2)}

PENDING RECOMMENDATIONS:
${JSON.stringify(recommendations, null, 2)}

UPCOMING CALENDAR EVENTS:
${JSON.stringify(calendarEvents, null, 2)}

Current date/time: ${new Date().toISOString()}

Based on this data, answer the user's question directly and actionably. 
Be concise but thorough. If data is missing or unclear, say so.
Provide specific recommendations based on patterns you observe.
`

    // Call Claude with context
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `${context}\n\nUser Question: ${query}`,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Parse response and create recommendation if needed
    const responseText = content.text
    let shouldCreateRecommendation = false
    let recommendationType = 'other'

    // Heuristics to determine if we should create a recommendation
    if (
      query.toLowerCase().includes('attention') ||
      query.toLowerCase().includes('urgent') ||
      query.toLowerCase().includes('risk')
    ) {
      shouldCreateRecommendation = true
      recommendationType = 'risk_flag'
    } else if (
      query.toLowerCase().includes('follow') ||
      query.toLowerCase().includes('pending')
    ) {
      shouldCreateRecommendation = true
      recommendationType = 'follow_up'
    }

    // Create recommendation if appropriate
    if (shouldCreateRecommendation && !responseText.includes('no action needed')) {
      await supabase.from('workflow_recommendations').insert({
        site_id: siteId,
        user_id: userId,
        recommendation_type: recommendationType,
        recommendation_text: responseText.substring(0, 500),
        reason: `Generated from command center query: "${query}"`,
        priority: 'medium',
        status: 'pending',
      })
    }

    return Response.json({
      query,
      answer: responseText,
      dataContext: {
        emailCount: emails?.length || 0,
        projectCount: projects?.length || 0,
        openActionItems: actionItems?.length || 0,
        contractCount: contracts?.length || 0,
        pendingRecommendations: recommendations?.length || 0,
        upcomingEvents: calendarEvents?.length || 0,
      },
    })
  } catch (error) {
    console.error('Command center query error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to process query' },
      { status: 500 }
    )
  }
}
