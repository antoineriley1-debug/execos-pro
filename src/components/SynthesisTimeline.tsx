'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'

interface SynthesisItem {
  id: string
  week_start: string
  week_end: string
  content: string
  created_at: string
  summary_preview: string
  source_email_count: number
  source_contract_count: number
  source_event_count: number
}

interface SynthesisTimelineProps {
  dateRange: { start: string; end: string }
  onSelectSynthesis: (synthesis: any) => void
  selectedSynthesisId?: string
}

export function SynthesisTimeline({
  dateRange,
  onSelectSynthesis,
  selectedSynthesisId,
}: SynthesisTimelineProps) {
  const { user, loading: authLoading } = useAuth()
  const [syntheses, setSyntheses] = useState<SynthesisItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTimeline = async () => {
      setLoading(true)
      setError(null)

      try {
        const token = (await user?.getIdToken?.()) || ''
        if (!token) {
          setError('Not authenticated')
          return
        }

        const params = new URLSearchParams({
          startDate: dateRange.start,
          endDate: dateRange.end,
          limit: '50',
        })

        const response = await fetch(`/api/synthesis/timeline?${params}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch synthesis timeline')
        }

        const data = await response.json()
        setSyntheses(data.timeline || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch timeline')
      } finally {
        setLoading(false)
      }
    }

    if (user && !authLoading) {
      fetchTimeline()
    }
  }, [dateRange, user, authLoading])

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
        {error}
      </div>
    )
  }

  if (syntheses.length === 0) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 text-gray-600 rounded-lg text-sm text-center">
        No syntheses found for the selected date range
      </div>
    )
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {syntheses.map((synthesis) => {
        const startDate = new Date(synthesis.week_start)
        const endDate = new Date(synthesis.week_end)
        const isSelected = synthesis.id === selectedSynthesisId

        return (
          <button
            key={synthesis.id}
            onClick={() => onSelectSynthesis(synthesis)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
              isSelected
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="font-semibold text-gray-900">
                {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
              </div>
              <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                {new Date(synthesis.created_at).toLocaleDateString()}
              </div>
            </div>

            <p className="text-sm text-gray-600 line-clamp-2 mb-2">{synthesis.summary_preview}</p>

            <div className="flex gap-3 text-xs text-gray-500">
              <span>📧 {synthesis.source_email_count}</span>
              <span>📄 {synthesis.source_contract_count}</span>
              <span>📅 {synthesis.source_event_count}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
