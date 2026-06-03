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

interface SynthesisQueryRequest {
  synthesisId: string
  question: string
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

async function getSynthesis(userId: string, synthesisId: string) {
  const { data, error } = await supabase
    .from('synthesis_archives')
    .select('*')
    .eq('id', synthesisId)
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw error
  }

  return data
}

async function answerQuestion(synthesisContent: string, question: string): Promise<{
  answer: string
  inputTokens: number
  outputTokens: number
}> {
  const systemPrompt = `You are an expert analyst specialized in reviewing comprehensive executive summaries. Your role is to answer specific questions about the synthesized data with precision and clarity.

INSTRUCTIONS:
1. Answer based ONLY on information present in the provided synthesis
2. If the answer cannot be found in the synthesis, clearly state: "This information is not available in the synthesis"
3. Provide citations by referencing specific sections from the synthesis
4. Be concise but complete in your responses
5. Use bullet points for complex answers
6. Highlight any relevant risks or concerns
7. If asked about information outside the synthesis scope, redirect to what IS available`

  const userPrompt = `Here is the executive synthesis document:

<synthesis>
${synthesisContent}
</synthesis>

Please answer the following question:
${question}`

  const messages: ClaudeMessage[] = [
    {
      role: 'user',
      content: userPrompt,
    },
  ]

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1500,
    system: systemPrompt,
    messages: messages,
  })

  const answer = response.content.find((c) => c.type === 'text')?.text || ''
  const inputTokens = response.usage?.input_tokens || 0
  const outputTokens = response.usage?.output_tokens || 0

  return {
    answer,
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

    const body: SynthesisQueryRequest = await request.json()

    if (!body.synthesisId || !body.question) {
      return NextResponse.json(
        { error: 'Missing required fields: synthesisId, question' },
        { status: 400 }
      )
    }

    if (body.question.trim().length === 0) {
      return NextResponse.json(
        { error: 'Question cannot be empty' },
        { status: 400 }
      )
    }

    if (body.question.length > 2000) {
      return NextResponse.json(
        { error: 'Question is too long (max 2000 characters)' },
        { status: 400 }
      )
    }

    const synthesis = await getSynthesis(user.id, body.synthesisId)

    if (!synthesis) {
      return NextResponse.json(
        { error: 'Synthesis not found or access denied' },
        { status: 404 }
      )
    }

    const { answer, inputTokens, outputTokens } = await answerQuestion(
      synthesis.content,
      body.question
    )

    const { data: queryRecord, error: insertError } = await supabase
      .from('synthesis_queries')
      .insert({
        user_id: user.id,
        synthesis_id: body.synthesisId,
        question: body.question,
        answer: answer,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        created_at: new Date().toISOString(),
      })
      .select()

    if (insertError) {
      console.error('Error storing query result:', insertError)
      // Still return the answer even if storage fails
    }

    return NextResponse.json(
      {
        answer,
        tokensUsed: {
          input: inputTokens,
          output: outputTokens,
          total: inputTokens + outputTokens,
        },
        queryId: queryRecord?.[0]?.id,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Synthesis query error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('Claude API error')) {
      return NextResponse.json(
        {
          error: 'AI service error',
          message: 'Failed to process your question. Please try again.',
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
