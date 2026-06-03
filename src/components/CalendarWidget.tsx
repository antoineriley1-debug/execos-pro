'use client'

import { useState, useEffect } from 'react'

interface CalendarEvent {
  id: string
  title: string
  description: string
  event_type: string
  start_datetime: string
  end_datetime: string
  status: string
  location?: string
  attendees?: string[]
}

interface CalendarWidgetProps {
  siteId: string
  userId: string
}

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const getEventTypeColor = (type: string) => {
  switch (type) {
    case 'deadline':
      return 'bg-red-100 text-red-800 border-red-300'
    case 'meeting':
      return 'bg-blue-100 text-blue-800 border-blue-300'
    case 'follow_up':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    case 'reminder':
      return 'bg-purple-100 text-purple-800 border-purple-300'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}

export function CalendarWidget({ siteId, userId }: CalendarWidgetProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda'>('month')

  useEffect(() => {
    fetchEvents()
  }, [siteId, userId])

  const fetchEvents = async () => {
    try {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      const response = await fetch(
        `/api/calendar/events?siteId=${siteId}&userId=${userId}&startDate=${start.toISOString()}&endDate=${end.toISOString()}`
      )

      if (!response.ok) throw new Error('Failed to fetch events')
      const data = await response.json()
      setEvents(data)
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const getEventsForDate = (day: number) => {
    return events.filter((event) => {
      const eventDate = new Date(event.start_datetime)
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear()
      )
    })
  }

  const upcomingEvents = events
    .filter((e) => new Date(e.start_datetime) >= new Date())
    .sort(
      (a, b) =>
        new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
    )
    .slice(0, 5)

  if (loading) {
    return <div className="text-center text-gray-500 p-6">Loading calendar...</div>
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <p className="text-gray-600 text-sm mt-1">{events.length} events this month</p>
        </div>

        <div className="flex gap-2">
          {(['month', 'week', 'agenda'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-2 rounded text-sm font-medium transition ${
                viewMode === mode
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'month' && (
        <div>
          {/* Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() =>
                setCurrentDate(
                  new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
                )
              }
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
            >
              ← Previous
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
            >
              Today
            </button>
            <button
              onClick={() =>
                setCurrentDate(
                  new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
                )
              }
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
            >
              Next →
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: getFirstDayOfMonth(currentDate) }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-gray-50 rounded p-2 h-24"></div>
            ))}

            {Array.from({ length: getDaysInMonth(currentDate) }).map((_, i) => {
              const day = i + 1
              const dayEvents = getEventsForDate(day)
              const isCurrentDay = isToday(
                new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
              )

              return (
                <div
                  key={day}
                  className={`rounded p-2 h-24 border overflow-y-auto ${
                    isCurrentDay
                      ? 'bg-blue-50 border-blue-500'
                      : dayEvents.length > 0
                        ? 'bg-gray-50 border-gray-300'
                        : 'bg-white border-gray-300'
                  }`}
                >
                  <div
                    className={`font-semibold mb-1 ${
                      isCurrentDay ? 'text-blue-600' : 'text-gray-900'
                    }`}
                  >
                    {day}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 transition ${getEventTypeColor(
                          event.event_type
                        )}`}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {viewMode === 'agenda' && (
        <div className="space-y-3">
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => (
              <div key={event.id} className={`p-4 rounded border-l-4 ${getEventTypeColor(
                event.event_type
              )}`}>
                <div className="font-semibold text-gray-900 mb-1">{event.title}</div>
                <div className="text-sm text-gray-600 mb-2">
                  {new Date(event.start_datetime).toLocaleString()}
                </div>
                {event.description && (
                  <p className="text-sm text-gray-700">{event.description}</p>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">No upcoming events</p>
          )}
        </div>
      )}
    </div>
  )
}
