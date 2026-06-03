import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface SynthesisDetail {
  id: string
  week_start: string
  week_end: string
  created_at: string
  content: string
  source_email_count: number
  source_contract_count: number
  source_event_count: number
  estimated_pages: number
  input_tokens: number
  output_tokens: number
}

interface SynthesisWithQueries extends SynthesisDetail {
  queries: Array<{
    id: string
    question: string
    answer: string
    created_at: string
  }>
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const synthesisId = params.id

    if (!synthesisId || synthesisId.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid synthesis ID' }, { status: 400 })
    }

    const url = new URL(request.url)
    const includeQueries = url.searchParams.get('includeQueries') === 'true'

    const { data: synthesis, error: synthesisError } = await supabase
      .from('synthesis_archives')
      .select('*')
      .eq('id', synthesisId)
      .eq('user_id', user.id)
      .single()

    if (synthesisError) {
      if (synthesisError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Synthesis not found or access denied' },
          { status: 404 }
        )
      }
      throw synthesisError
    }

    const response: SynthesisDetail | SynthesisWithQueries = synthesis

    if (includeQueries) {
      const { data: queries, error: queriesError } = await supabase
        .from('synthesis_queries')
        .select('id, question, answer, created_at')
        .eq('synthesis_id', synthesisId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (queriesError) {
        console.error('Error fetching queries:', queriesError)
      }

      const responseWithQueries = {
        ...response,
        queries: queries || [],
      } as SynthesisWithQueries

      return NextResponse.json(responseWithQueries, { status: 200 })
    }

    return NextResponse.json(response as SynthesisDetail, { status: 200 })
  } catch (error) {
    console.error('Synthesis retrieval error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      { error: 'Internal server error', message },
      { status: 500 }
    )
  }
}
