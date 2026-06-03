import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!siteId || !userId) {
      return Response.json({ error: 'Missing siteId or userId' }, { status: 400 })
    }

    let query = supabase
      .from('calendar_events')
      .select('*')
      .eq('site_id', siteId)
      .eq('user_id', userId)
      .order('start_datetime', { ascending: true })

    if (startDate) {
      query = query.gte('start_datetime', startDate)
    }

    if (endDate) {
      query = query.lte('start_datetime', endDate)
    }

    const { data, error } = await query

    if (error) throw error

    return Response.json(data)
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch events' },
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
      title,
      description,
      eventType,
      startDatetime,
      endDatetime,
      durationMinutes,
      location,
      attendees,
      allDay,
      recurrenceRule,
      reminderMinutesBefore,
      linkedEmailId,
      linkedProjectId,
      linkedContractId,
      linkedSiteId,
      notes,
    } = body

    if (!siteId || !userId || !title || !startDatetime) {
      return Response.json(
        {
          error:
            'Missing required fields: siteId, userId, title, startDatetime',
        },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        site_id: siteId,
        user_id: userId,
        title,
        description,
        event_type: eventType || 'meeting',
        start_datetime: startDatetime,
        end_datetime: endDatetime,
        duration_minutes: durationMinutes,
        location,
        attendees: attendees || [],
        all_day: allDay || false,
        recurrence_rule: recurrenceRule,
        reminder_minutes_before: reminderMinutesBefore || [15, 60, 1440],
        linked_email_id: linkedEmailId,
        linked_project_id: linkedProjectId,
        linked_contract_id: linkedContractId,
        linked_site_id: linkedSiteId,
        notes,
      })
      .select()
      .single()

    if (error) throw error

    // Create reminders
    if (reminderMinutesBefore && reminderMinutesBefore.length > 0) {
      const reminders = reminderMinutesBefore.map((minutes: number) => {
        const startTime = new Date(startDatetime)
        const reminderTime = new Date(startTime.getTime() - minutes * 60000)
        return {
          event_id: data.id,
          reminder_type: 'notification',
          reminder_datetime: reminderTime.toISOString(),
        }
      })

      await supabase.from('calendar_reminders').insert(reminders)
    }

    return Response.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating calendar event:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to create event' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return Response.json({ error: 'Missing event id' }, { status: 400 })
    }

    // Map camelCase to snake_case
    const dbUpdateData: Record<string, any> = {}
    Object.entries(updateData).forEach(([key, value]) => {
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
      dbUpdateData[snakeKey] = value
    })

    const { data, error } = await supabase
      .from('calendar_events')
      .update(dbUpdateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return Response.json(data)
  } catch (error) {
    console.error('Error updating calendar event:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to update event' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('id')

    if (!eventId) {
      return Response.json({ error: 'Missing event id' }, { status: 400 })
    }

    const { error } = await supabase.from('calendar_events').delete().eq('id', eventId)

    if (error) throw error

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error deleting calendar event:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to delete event' },
      { status: 500 }
    )
  }
}
