'use client'

import { useState, useEffect } from 'react'

interface CommandCenterData {
  widgets: {
    attentionNeeded: {
      overdueItems: any[]
      emailsWaitingReply: number
      projectsAtRisk: number
      upcomingDeadlines: any[]
      failedFollowUps: any[]
    }
    openActionItems: {
      items: any[]
      totalCount: number
    }
    weeklyPath: {
      deadlines: any[]
      projectCount: number
    }
    vendorIntelligence: {
      vendors: any[]
      overdueCount: number
    }
    siteSnapshot: {
      sites: any[]
      siteCount: number
    }
    changes: {
      newEmails: number
      completedTasks: number
    }
    aiInsights: {
      observations: any[]
      patterns: any[]
    }
  }
}

interface CommandCenterProps {
  siteId: string
  userId: string
}

export function CommandCenter({ siteId, userId }: CommandCenterProps) {
  const [data, setData] = useState<CommandCenterData | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [queryResponse, setQueryResponse] = useState<any>(null)
  const [queryLoading, setQueryLoading] = useState(false)

  useEffect(() => {
    fetchWidgets()
  }, [siteId, userId])

  const fetchWidgets = async () => {
    try {
      const response = await fetch(
        `/api/command-center/widgets?siteId=${siteId}&userId=${userId}`
      )
      if (!response.ok) throw new Error('Failed to fetch widgets')
      const data = await response.json()
      setData(data)
    } catch (error) {
      console.error('Error fetching widgets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setQueryLoading(true)
    try {
      const response = await fetch('/api/command-center/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, userId, query }),
      })
      if (!response.ok) throw new Error('Failed to process query')
      const result = await response.json()
      setQueryResponse(result)
    } catch (error) {
      console.error('Error processing query:', error)
    } finally {
      setQueryLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center text-gray-500 p-6">Loading command center...</div>
  }

  return (
    <div className="space-y-6">
      {/* Query Interface */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">AI Command Center</h2>
        <p className="text-gray-600 mb-4">
          Ask me anything about your operations. I'll analyze your data and provide
          recommendations.
        </p>

        <form onSubmit={handleQuery} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., What needs my attention today? Which vendors haven't responded?"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={queryLoading || !query.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
          >
            {queryLoading ? 'Analyzing...' : 'Ask AI'}
          </button>
        </form>

        {queryResponse && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">AI Response</h3>
            <p className="text-blue-800 whitespace-pre-wrap">{queryResponse.answer}</p>
            {queryResponse.dataContext && (
              <div className="mt-3 text-sm text-blue-700">
                <p>Data analyzed: {queryResponse.dataContext.emailCount} emails, {queryResponse.dataContext.projectCount} projects, {queryResponse.dataContext.openActionItems} action items</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* What Needs Attention */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          🚨 What Needs Your Attention Today
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-red-50 p-4 rounded border border-red-200">
            <p className="text-2xl font-bold text-red-600">
              {data?.widgets.attentionNeeded.overdueItems.length || 0}
            </p>
            <p className="text-sm text-red-700">Overdue Items</p>
          </div>

          <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
            <p className="text-2xl font-bold text-yellow-600">
              {data?.widgets.attentionNeeded.upcomingDeadlines.length || 0}
            </p>
            <p className="text-sm text-yellow-700">Upcoming Deadlines</p>
          </div>

          <div className="bg-orange-50 p-4 rounded border border-orange-200">
            <p className="text-2xl font-bold text-orange-600">
              {data?.widgets.attentionNeeded.emailsWaitingReply || 0}
            </p>
            <p className="text-sm text-orange-700">Emails Waiting Reply</p>
          </div>

          <div className="bg-blue-50 p-4 rounded border border-blue-200">
            <p className="text-2xl font-bold text-blue-600">
              {data?.widgets.attentionNeeded.projectsAtRisk || 0}
            </p>
            <p className="text-sm text-blue-700">Projects at Risk</p>
          </div>

          <div className="bg-purple-50 p-4 rounded border border-purple-200">
            <p className="text-2xl font-bold text-purple-600">
              {data?.widgets.attentionNeeded.failedFollowUps.length || 0}
            </p>
            <p className="text-sm text-purple-700">Follow-ups Needed</p>
          </div>

          <div className="bg-green-50 p-4 rounded border border-green-200">
            <p className="text-2xl font-bold text-green-600">
              {data?.widgets.openActionItems.totalCount || 0}
            </p>
            <p className="text-sm text-green-700">Open Actions</p>
          </div>
        </div>

        {/* Overdue Items List */}
        {data?.widgets.attentionNeeded.overdueItems.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-semibold text-red-900 mb-3">Overdue Items</h4>
            <div className="space-y-2">
              {data.widgets.attentionNeeded.overdueItems.slice(0, 3).map((item) => (
                <div key={item.id} className="p-3 bg-red-50 rounded border-l-4 border-red-500">
                  <p className="font-medium text-red-900">{item.title}</p>
                  <p className="text-sm text-red-700">Due: {item.due_date}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Vendor Intelligence */}
      {data?.widgets.vendorIntelligence.vendors.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">👥 Vendor Intelligence</h3>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded border border-blue-200">
              <p className="text-2xl font-bold text-blue-600">
                {data.widgets.vendorIntelligence.vendors.length}
              </p>
              <p className="text-sm text-blue-700">Total Vendors</p>
            </div>

            <div className="bg-red-50 p-4 rounded border border-red-200">
              <p className="text-2xl font-bold text-red-600">
                {data.widgets.vendorIntelligence.overdueCount}
              </p>
              <p className="text-sm text-red-700">Overdue Responses</p>
            </div>

            <div className="bg-green-50 p-4 rounded border border-green-200">
              <p className="text-2xl font-bold text-green-600">
                {(data.widgets.vendorIntelligence.vendors.length - data.widgets.vendorIntelligence.overdueCount) || 0}
              </p>
              <p className="text-sm text-green-700">On Track</p>
            </div>
          </div>

          <div className="space-y-3">
            {data.widgets.vendorIntelligence.vendors
              .filter((v) => v.isOverdue)
              .slice(0, 5)
              .map((vendor) => (
                <div
                  key={vendor.id}
                  className="p-3 bg-red-50 rounded border-l-4 border-red-500"
                >
                  <p className="font-medium text-red-900">{vendor.first_name} {vendor.last_name}</p>
                  <p className="text-sm text-red-700">
                    Last contact: {vendor.daysSinceContact} days ago
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* AI Insights */}
      {data?.widgets.aiInsights.observations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">💡 AI Insights & Patterns</h3>

          <div className="space-y-3">
            {data.widgets.aiInsights.observations.slice(0, 3).map((obs) => (
              <div key={obs.id} className="p-4 bg-purple-50 rounded border border-purple-200">
                <p className="text-sm font-semibold text-purple-900 mb-1">
                  {obs.observation_type.toUpperCase()}
                </p>
                <p className="text-purple-800">{obs.observation_text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Yesterday vs Today */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Yesterday vs Today</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded border border-blue-200">
            <p className="text-2xl font-bold text-blue-600">
              {data?.widgets.changes.newEmails || 0}
            </p>
            <p className="text-sm text-blue-700">New Emails (Last 24h)</p>
          </div>

          <div className="bg-green-50 p-4 rounded border border-green-200">
            <p className="text-2xl font-bold text-green-600">
              {data?.widgets.changes.completedTasks || 0}
            </p>
            <p className="text-sm text-green-700">Tasks Completed</p>
          </div>
        </div>
      </div>
    </div>
  )
}
