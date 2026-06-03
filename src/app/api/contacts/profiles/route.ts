import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')
    const contactEmail = searchParams.get('email')

    if (!siteId) {
      return Response.json({ error: 'Missing siteId' }, { status: 400 })
    }

    let query = supabase
      .from('contact_profiles')
      .select('*')
      .eq('site_id', siteId)

    if (contactEmail) {
      query = query.eq('contact_email', contactEmail)
    }

    const { data, error } = await query

    if (error) throw error

    return Response.json(data)
  } catch (error) {
    console.error('Error fetching contact profiles:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch profiles' },
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
      contactEmail,
      communicationStyle,
      commonRequests,
      associatedSites,
      associatedProjects,
      urgencyPattern,
      responseExpectations,
      preferredTone,
      painPoints,
      isDecisionMaker,
      notes,
    } = body

    if (!siteId || !userId || !contactEmail) {
      return Response.json(
        { error: 'Missing required fields: siteId, userId, contactEmail' },
        { status: 400 }
      )
    }

    // Check if profile already exists
    const { data: existing } = await supabase
      .from('contact_profiles')
      .select('id')
      .eq('site_id', siteId)
      .eq('contact_email', contactEmail)
      .single()

    if (existing) {
      // Update existing profile
      const { data, error } = await supabase
        .from('contact_profiles')
        .update({
          communication_style: communicationStyle,
          common_requests: commonRequests || [],
          associated_sites: associatedSites || [],
          associated_projects: associatedProjects || [],
          urgency_pattern: urgencyPattern,
          response_expectations: responseExpectations || {},
          preferred_tone: preferredTone,
          pain_points: painPoints || [],
          is_decision_maker: isDecisionMaker,
          notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return Response.json(data)
    }

    // Create new profile
    const { data, error } = await supabase
      .from('contact_profiles')
      .insert({
        site_id: siteId,
        user_id: userId,
        contact_email: contactEmail,
        communication_style: communicationStyle,
        common_requests: commonRequests || [],
        associated_sites: associatedSites || [],
        associated_projects: associatedProjects || [],
        urgency_pattern: urgencyPattern,
        response_expectations: responseExpectations || {},
        preferred_tone: preferredTone,
        pain_points: painPoints || [],
        is_decision_maker: isDecisionMaker,
        notes: notes,
      })
      .select()
      .single()

    if (error) throw error

    return Response.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating/updating profile:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to save profile' },
      { status: 500 }
    )
  }
}
