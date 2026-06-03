import { createClient } from '@supabase/supabase-js'
import { Anthropic } from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')
    const userId = searchParams.get('userId')
    const status = searchParams.get('status') || 'pending'

    if (!siteId || !userId) {
      return Response.json({ error: 'Missing siteId or userId' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('workflow_recommendations')
      .select('*')
      .eq('site_id', siteId)
      .eq('user_id', userId)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) throw error

    return Response.json(data)
  } catch (error) {
    console.error('Error fetching recommendations:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch recommendations' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      siteId,
      userId,
      recommendationType,
      recommendationText,
      reason,
      relatedItems,
      priority,
      expiresAt,
    } = body

    if (!siteId || !userId || !recommendationType || !recommendationText) {
      return Response.json(
        {
          error:
            'Missing required fields: siteId, userId, recommendationType, recommendationText',
        },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('workflow_recommendations')
      .insert({
        site_id: siteId,
        user_id: userId,
        recommendation_type: recommendationType,
        recommendation_text: recommendationText,
        reason,
        related_items: relatedItems || {},
        priority: priority || 'medium',
        status: 'pending',
        expires_at: expiresAt,
      })
      .select()
      .single()

    if (error) throw error

    return Response.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating recommendation:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to create recommendation' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, status, dismissedAt, completedAt } = body

    if (!id) {
      return Response.json({ error: 'Missing recommendation id' }, { status: 400 })
    }

    const updateData: Record<string, any> = {
      status,
    }

    if (dismissedAt) {
      updateData.dismissed_at = dismissedAt
    }

    if (completedAt) {
      updateData.completed_at = completedAt
    }

    const { data, error } = await supabase
      .from('workflow_recommendations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return Response.json(data)
  } catch (error) {
    console.error('Error updating recommendation:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to update recommendation' },
      { status: 500 }
    )
  }
}
