import { createClient } from '@supabase/supabase-js'

// Mark route as dynamic since it uses request.url
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')
    const userId = searchParams.get('userId')

    if (!siteId || !userId) {
      return Response.json({ error: 'Missing siteId or userId' }, { status: 400 })
    }

    const now = new Date()
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // 1. What Needs My Attention Today?
    const [
      { data: overdueItems },
      { data: emailsWaitingReply },
      { data: projectsAtRisk },
      { data: upcomingDeadlines },
      { data: failedFollowUps },
    ] = await Promise.all([
      supabase
        .from('action_items')
        .select('*')
        .eq('site_id', siteId)
        .lt('due_date', now.toISOString().split('T')[0])
        .eq('status', 'open'),

      supabase
        .from('emails')
        .select('*')
        .eq('site_id', siteId)
        .eq('created_by_user', userId)
        .gt('received_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()),

      supabase
        .from('projects')
        .select('*, action_items(count)')
        .eq('site_id', siteId)
        .eq('status', 'active'),

      supabase
        .from('calendar_events')
        .select('*')
        .eq('site_id', siteId)
        .gte('start_datetime', now.toISOString())
        .lte('start_datetime', threeDaysFromNow.toISOString()),

      supabase
        .from('workflow_recommendations')
        .select('*')
        .eq('site_id', siteId)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .eq('recommendation_type', 'follow_up'),
    ])

    // 2. Open Action Items
    const { data: allActionItems } = await supabase
      .from('action_items')
      .select('*')
      .eq('site_id', siteId)
      .neq('status', 'completed')

    // 3. This Week's Critical Path
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const { data: weeklyDeadlines } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('site_id', siteId)
      .eq('event_type', 'deadline')
      .gte('start_datetime', now.toISOString())
      .lte('start_datetime', weekFromNow.toISOString())

    // 4. Vendor Intelligence
    const { data: vendors } = await supabase
      .from('contacts')
      .select('*')
      .eq('site_id', siteId)
      .eq('role', 'vendor')

    const vendorStats = await Promise.all(
      (vendors || []).map(async (vendor) => {
        const { data: vendorEmails } = await supabase
          .from('emails')
          .select('*')
          .eq('from_address', vendor.email)
          .order('received_at', { ascending: false })
          .limit(1)

        const lastContact = vendorEmails?.[0]?.received_at
        const daysSinceContact = lastContact
          ? Math.floor(
              (now.getTime() - new Date(lastContact).getTime()) / (24 * 60 * 60 * 1000)
            )
          : null

        return {
          ...vendor,
          lastContact,
          daysSinceContact,
          isOverdue: daysSinceContact && daysSinceContact > 5,
        }
      })
    )

    // 5. Site Status Snapshot
    const { data: sites } = await supabase.from('sites').select('*').eq('owner_id', userId)

    // 6. Yesterday vs Today
    const { data: yesterdayEmails } = await supabase
      .from('emails')
      .select('*')
      .eq('site_id', siteId)
      .gte('received_at', yesterday.toISOString())
      .lt('received_at', now.toISOString())

    const { data: completedToday } = await supabase
      .from('action_items')
      .select('*')
      .eq('site_id', siteId)
      .eq('status', 'completed')
      .gte('updated_at', now.toISOString().split('T')[0])

    // 7. AI Insights & Recommendations
    const { data: allObservations } = await supabase
      .from('ai_observations')
      .select('*')
      .eq('site_id', siteId)
      .eq('user_id', userId)
      .eq('is_acknowledged', false)
      .order('timestamp', { ascending: false })
      .limit(5)

    const { data: allPatterns } = await supabase
      .from('workflow_patterns')
      .select('*')
      .eq('site_id', siteId)
      .eq('user_id', userId)
      .order('last_occurred_at', { ascending: false })
      .limit(5)

    // Assemble response
    return Response.json({
      widgets: {
        attentionNeeded: {
          title: 'What Needs My Attention Today?',
          overdueItems: overdueItems || [],
          emailsWaitingReply: emailsWaitingReply?.length || 0,
          projectsAtRisk: projectsAtRisk?.length || 0,
          upcomingDeadlines: upcomingDeadlines || [],
          failedFollowUps: failedFollowUps || [],
        },
        openActionItems: {
          title: 'Open Action Items',
          items: allActionItems || [],
          totalCount: allActionItems?.length || 0,
        },
        weeklyPath: {
          title: "This Week's Critical Path",
          deadlines: weeklyDeadlines || [],
          projectCount: projectsAtRisk?.length || 0,
        },
        vendorIntelligence: {
          title: 'Vendor Intelligence',
          vendors: vendorStats || [],
          overdueCount: vendorStats?.filter((v) => v.isOverdue).length || 0,
        },
        siteSnapshot: {
          title: 'Site Status Snapshot',
          sites: sites || [],
          siteCount: sites?.length || 0,
        },
        changes: {
          title: 'Yesterday vs Today',
          newEmails: yesterdayEmails?.length || 0,
          completedTasks: completedToday?.length || 0,
          changedAt: {
            yesterday: yesterday.toISOString(),
            today: now.toISOString(),
          },
        },
        aiInsights: {
          title: 'AI Insights & Recommendations',
          observations: allObservations || [],
          patterns: allPatterns || [],
        },
      },
      generatedAt: now.toISOString(),
    })
  } catch (error) {
    console.error('Error fetching command center widgets:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch widgets' },
      { status: 500 }
    )
  }
}
