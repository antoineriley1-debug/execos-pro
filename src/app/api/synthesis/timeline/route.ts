import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Mark route as dynamic since it uses request.headers
export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface SynthesisTimelineItem {
  id: string
  week_start: string
  week_end: string
  created_at: string
  summary_preview: string
  page_reduction: number
  source_email_count: number
  source_contract_count: number
  source_event_count: number
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

function generateSummaryPreview(content: string, maxLength: number = 200): string {
  if (!content) return ''
  const preview = content.substring(0, maxLength)
  return preview.length < content.length ? preview + '...' : preview
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)

    let query = supabase
      .from('synthesis_archives')
      .select('id, week_start, week_end, created_at, content, source_email_count, source_contract_count, source_event_count')
      .eq('user_id', user.id)
      .order('week_start', { ascending: false })
      .limit(limit)

    if (startDate) {
      try {
        new Date(startDate).toISOString()
        query = query.gte('week_start', startDate)
      } catch {
        return NextResponse.json(
          { error: 'Invalid startDate format. Use ISO 8601 format (YYYY-MM-DD)' },
          { status: 400 }
        )
      }
    }

    if (endDate) {
      try {
        new Date(endDate).toISOString()
        query = query.lte('week_end', endDate)
      } catch {
        return NextResponse.json(
          { error: 'Invalid endDate format. Use ISO 8601 format (YYYY-MM-DD)' },
          { status: 400 }
        )
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching synthesis timeline:', error)
      return NextResponse.json(
        { error: 'Failed to retrieve synthesis timeline' },
        { status: 500 }
      )
    }

    const timeline: SynthesisTimelineItem[] = (data || []).map((item: any) => ({
      id: item.id,
      week_start: item.week_start,
      week_end: item.week_end,
      created_at: item.created_at,
      summary_preview: generateSummaryPreview(item.content),
      page_reduction: Math.round(((item.source_email_count + item.source_contract_count + item.source_event_count) / 10) * 100),
      source_email_count: item.source_email_count || 0,
      source_contract_count: item.source_contract_count || 0,
      source_event_count: item.source_event_count || 0,
    }))

    return NextResponse.json(
      {
        items: timeline,
        count: timeline.length,
        period: startDate || endDate ? { startDate, endDate } : null,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Synthesis timeline error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      { error: 'Internal server error', message },
      { status: 500 }
    )
  }
}
