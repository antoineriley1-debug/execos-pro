import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Anthropic } from '@anthropic-ai/sdk'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const claudeApiKey = process.env.ANTHROPIC_API_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

if (!claudeApiKey) {
  throw new Error('Missing Anthropic API key')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const anthropic = new Anthropic({
  apiKey: claudeApiKey,
})

interface SynthesisGenerateRequest {
  startDate?: string
  endDate?: string
}

interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string
}

async function getAuthUser(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1]
  if (!token) {
    return null
  }

  const {
    data: { user },
  } = await supabase.auth.getUser(token)
  return user
}

async function aggregateData(userId: string, startDate: string, endDate: string) {
  const [emailsRes, contractsRes, eventsRes] = await Promise.all([
    supabase
      .from('emails')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate)
      .lte('created_at', endDate),
    supabase
      .from('contracts')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate)
      .lte('created_at', endDate),
    supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', startDate)
      .lte('start_time', endDate),
  ])

  if (emailsRes.error) {
    console.error('Error fetching emails:', emailsRes.error)
  }
  if (contractsRes.error) {
    console.error('Error fetching contracts:', contractsRes.error)
  }
  if (eventsRes.error) {
    console.error('Error fetching calendar events:', eventsRes.error)
  }

  return {
    emails: emailsRes.data || [],
    contracts: contractsRes.data || [],
    events: eventsRes.data || [],
  }
}

function formatDataForClaude(data: {
  emails: any[]
  contracts: any[]
  events: any[]
}): string {
  let formatted = 'DATA TO SYNTHESIZE:\n\n'

  if (data.emails.length > 0) {
    formatted += `EMAILS (${data.emails.length} total):\n`
    data.emails.forEach((email, idx) => {
      formatted += `${idx + 1}. From: ${email.from || 'Unknown'}\n`
      formatted += `   Subject: ${email.subject || 'No subject'}\n`
      formatted += `   Preview: ${(email.body || '').substring(0, 150)}...\n\n`
    })
  }

  if (data.contracts.length > 0) {
    formatted += `CONTRACTS (${data.contracts.length} total):\n`
    data.contracts.forEach((contract, idx) => {
      formatted += `${idx + 1}. ${contract.name || 'Unnamed contract'}\n`
      formatted += `   Status: ${contract.status || 'Unknown'}\n`
      formatted += `   Preview: ${(contract.content || '').substring(0, 150)}...\n\n`
    })
  }

  if (data.events.length > 0) {
    formatted += `CALENDAR EVENTS (${data.events.length} total):\n`
    data.events.forEach((event, idx) => {
      formatted += `${idx + 1}. ${event.title || 'Untitled'} on ${event.start_time || 'Unknown date'}\n`
      formatted += `   Description: ${(event.description || '').substring(0, 150)}...\n\n`
    })
  }

  return formatted
}

async function generateSynthesis(aggregatedData: string): Promise<{
  synthesis: string
  inputTokens: number
  outputTokens: number
}> {
  const systemPrompt = `You are an expert executive summarizer. Your task is to compress extensive business data (emails, contracts, calendar events) into a concise 10-page executive summary.

REQUIREMENTS:
1. Create a comprehensive yet condensed summary
2. Preserve critical decisions, deadlines, and risks
3. Identify key stakeholders and their roles
4. Highlight emerging patterns or concerns
5. Format with clear sections and headers
6. Use bullet points for readability
7. Include a risk assessment section
8. Note any urgent items requiring attention

OUTPUT FORMAT:
Provide the summary as a structured document with these sections:
- Executive Overview (1 page)
- Key Decisions & Actions (2 pages)
- Contracts & Agreements (1 page)
- Calendar & Timeline (1 page)
- Stakeholders & Roles (1 page)
- Risk Assessment (1 page)
- Emerging Patterns (1 page)
- Recommendations (1 page)
- Appendix: Key Dates & Contacts (1 page)`

  const userPrompt = `Please create a 10-page executive synthesis from the following data:\n\n${aggregatedData}`

  const messages: ClaudeMessage[] = [
    {
      role: 'user',
      content: userPrompt,
    },
  ]

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4000,
    system: systemPrompt,
    messages: messages,
  })

  const synthesis = response.content.find((c) => c.type === 'text')?.text || ''
  const inputTokens = response.usage?.input_tokens || 0
  const outputTokens = response.usage?.output_tokens || 0

  return {
    synthesis,
    inputTokens,
    outputTokens,
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: SynthesisGenerateRequest = await request.json()

    const now = new Date()
    const startDate = body.startDate || new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = body.endDate || now.toISOString()

    const aggregatedData = await aggregateData(user.id, startDate, endDate)

    if (
      aggregatedData.emails.length === 0 &&
      aggregatedData.contracts.length === 0 &&
      aggregatedData.events.length === 0
    ) {
      return NextResponse.json(
        {
          error: 'No data found in the specified date range',
          message: 'Please ensure there are emails, contracts, or calendar events to synthesize',
        },
        { status: 400 }
      )
    }

    const formattedData = formatDataForClaude(aggregatedData)

    const { synthesis, inputTokens, outputTokens } = await generateSynthesis(formattedData)

    const weekStart = new Date(startDate)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    const { data: synthesisRecord, error: insertError } = await supabase
      .from('synthesis_archives')
      .insert({
        user_id: user.id,
        week_start: weekStart.toISOString(),
        week_end: weekEnd.toISOString(),
        content: synthesis,
        source_email_count: aggregatedData.emails.length,
        source_contract_count: aggregatedData.contracts.length,
        source_event_count: aggregatedData.events.length,
        estimated_pages: 10,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        created_at: now.toISOString(),
      })
      .select()

    if (insertError) {
      console.error('Error storing synthesis:', insertError)
      return NextResponse.json(
        { error: 'Failed to store synthesis in database' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        synthesisId: synthesisRecord?.[0]?.id,
        jobStatus: 'completed',
        tokensUsed: {
          input: inputTokens,
          output: outputTokens,
          total: inputTokens + outputTokens,
        },
        dataProcessed: {
          emails: aggregatedData.emails.length,
          contracts: aggregatedData.contracts.length,
          events: aggregatedData.events.length,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Synthesis generation error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('Claude API error')) {
      return NextResponse.json(
        {
          error: 'AI service error',
          message: 'Failed to generate synthesis. Please try again.',
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error', message },
      { status: 500 }
    )
  }
}
