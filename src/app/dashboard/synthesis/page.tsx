'use client'

import { useState, useEffect } from 'react'
import { SynthesisTimeline } from '@/components/SynthesisTimeline'
import { SynthesisViewer } from '@/components/SynthesisViewer'
import { SynthesisQA } from '@/components/SynthesisQA'
import { SynthesisTrigger } from '@/components/SynthesisTrigger'

interface SynthesisData {
  id: string
  week_start: string
  week_end: string
  content: string
  created_at: string
  source_email_count: number
  source_contract_count: number
  source_event_count: number
  summary_preview?: string
}

export default function SynthesisDashboard() {
  const [selectedSynthesis, setSelectedSynthesis] = useState<SynthesisData | null>(null)
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  })
  const [refreshKey, setRefreshKey] = useState(0)

  const handleSynthesisTrigger = () => {
    setRefreshKey((prev) => prev + 1)
    setSelectedSynthesis(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Synthesis Dashboard</h1>
        <SynthesisTrigger onComplete={handleSynthesisTrigger} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Timeline */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Synthesis Timeline</h2>

            {/* Date Range Filter */}
            <div className="space-y-3 mb-6 pb-6 border-b">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <SynthesisTimeline
              key={refreshKey}
              dateRange={dateRange}
              onSelectSynthesis={setSelectedSynthesis}
              selectedSynthesisId={selectedSynthesis?.id}
            />
          </div>
        </div>

        {/* Right Column: Viewer & QA */}
        <div className="lg:col-span-2 space-y-6">
          {/* Synthesis Viewer */}
          {selectedSynthesis ? (
            <div className="bg-white rounded-lg shadow">
              <SynthesisViewer synthesis={selectedSynthesis} />
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-600">Select a synthesis to view details</p>
            </div>
          )}

          {/* Q&A Interface */}
          {selectedSynthesis && (
            <div className="bg-white rounded-lg shadow">
              <SynthesisQA synthesisId={selectedSynthesis.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
