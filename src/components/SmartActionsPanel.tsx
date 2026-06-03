import { useState, useEffect } from 'react'
import {
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Users,
  FolderOpen,
  Save,
  Clock,
  FileText,
  Zap,
  Loader,
} from 'lucide-react'

interface SmartActionsSuggestion {
  id: string
  action_type: string
  suggestion_text: string
  reasoning: string
  confidence_score: number
  priority: number
  suggestion_group: string
}

interface SmartActionsPanelProps {
  emailId: string
  siteId: string
  riskLevel: 'green' | 'yellow' | 'red'
  onActionExecuted?: (actionType: string, result: any) => void
}

export function SmartActionsPanel({
  emailId,
  siteId,
  riskLevel,
  onActionExecuted,
}: SmartActionsPanelProps) {
  const [suggestions, setSuggestions] = useState<SmartActionsSuggestion[]>([])
  const [groupedSuggestions, setGroupedSuggestions] = useState<Record<string, SmartActionsSuggestion[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [executingActions, setExecutingActions] = useState<Set<string>>(new Set())
  const [expandedGroup, setExpandedGroup] = useState<string | null>('response_options')

  useEffect(() => {
    loadSuggestions()
  }, [emailId])

  const loadSuggestions = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/emails/suggest-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId, siteId }),
      })

      if (!response.ok) throw new Error('Failed to load suggestions')

      const data = await response.json()
      setSuggestions(data.suggestions || [])
      setGroupedSuggestions(data.groupedSuggestions || {})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load suggestions')
    } finally {
      setLoading(false)
    }
  }

  const handleExecuteAction = async (actionType: string) => {
    setExecutingActions((prev) => new Set([...prev, actionType]))

    try {
      const response = await fetch('/api/emails/execute-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailId,
          siteId,
          actionType,
        }),
      })

      if (!response.ok) throw new Error('Action failed')

      const result = await response.json()
      onActionExecuted?.(actionType, result)

      // Reload suggestions after execution
      await loadSuggestions()
    } catch (err) {
      console.error('Action execution error:', err)
    } finally {
      setExecutingActions((prev) => {
        const newSet = new Set(prev)
        newSet.delete(actionType)
        return newSet
      })
    }
  }

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'draft_response':
      case 'draft_firm_response':
      case 'draft_friendly_response':
      case 'draft_escalation':
      case 'draft_summary':
        return <MessageSquare size={18} />
      case 'create_task':
      case 'create_multiple_tasks':
        return <CheckCircle size={18} />
      case 'add_contact':
        return <Users size={18} />
      case 'link_project':
      case 'create_project':
        return <FolderOpen size={18} />
      case 'schedule_followup':
        return <Clock size={18} />
      case 'save_memory':
        return <Save size={18} />
      case 'flag_compliance':
      case 'escalate_risk':
        return <AlertTriangle size={18} />
      default:
        return <Zap size={18} />
    }
  }

  const getRiskBadgeColor = () => {
    switch (riskLevel) {
      case 'red':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default:
        return 'bg-green-100 text-green-800 border-green-300'
    }
  }

  const getSuggestionRecommendation = () => {
    if (riskLevel === 'red') {
      return '⚠️ HIGH RISK: Consider flagging for escalation immediately'
    }
    const deadline = suggestions.some((s) => s.action_type === 'create_task')
    if (deadline) {
      return '📅 Deadline detected: Create task to track action'
    }
    const newContact = suggestions.some((s) => s.action_type === 'add_contact')
    if (newContact) {
      return '👤 New contact identified: Consider adding to contacts'
    }
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader size={20} className="animate-spin text-gray-400 mr-2" />
        <span className="text-gray-600">Loading smart actions...</span>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Smart Actions</h3>
          <p className="text-sm text-gray-600 mt-1">
            {suggestions.length} suggested actions based on email analysis
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getRiskBadgeColor()}`}>
          {riskLevel.toUpperCase()} RISK
        </div>
      </div>

      {/* Risk Recommendation */}
      {getSuggestionRecommendation() && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded-lg text-sm text-blue-900">
          {getSuggestionRecommendation()}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
          <button
            onClick={loadSuggestions}
            className="ml-2 underline hover:no-underline font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Grouped Suggestions */}
      <div className="space-y-3">
        {Object.entries(groupedSuggestions).map(([group, groupSuggestions]) => (
          <div key={group} className="border border-gray-300 rounded-lg overflow-hidden">
            {/* Group Header */}
            <button
              onClick={() =>
                setExpandedGroup(expandedGroup === group ? null : group)
              }
              className="w-full flex items-center justify-between p-3 bg-white hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 capitalize">
                  {group.replace(/_/g, ' ')}
                </span>
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-gray-600 bg-gray-200 rounded-full">
                  {groupSuggestions.length}
                </span>
              </div>
              <span className={`transform transition ${expandedGroup === group ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {/* Group Actions */}
            {expandedGroup === group && (
              <div className="bg-white border-t border-gray-200 divide-y">
                {groupSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="p-4 hover:bg-gray-50 transition"
                  >
                    {/* Action Details */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-shrink-0 text-blue-600 mt-1">
                        {getActionIcon(suggestion.action_type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {suggestion.suggestion_text}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {suggestion.reasoning}
                        </p>

                        {/* Confidence Score */}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-xs">
                            <div
                              className={`h-full rounded-full ${
                                suggestion.confidence_score >= 80
                                  ? 'bg-green-500'
                                  : suggestion.confidence_score >= 60
                                    ? 'bg-yellow-500'
                                    : 'bg-orange-500'
                              }`}
                              style={{
                                width: `${suggestion.confidence_score}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-700">
                            {suggestion.confidence_score}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Execute Button */}
                    <button
                      onClick={() => handleExecuteAction(suggestion.action_type)}
                      disabled={executingActions.has(suggestion.action_type)}
                      className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition"
                    >
                      {executingActions.has(suggestion.action_type) ? (
                        <>
                          <Loader size={14} className="animate-spin" />
                          Executing...
                        </>
                      ) : (
                        <>
                          <Zap size={14} />
                          {suggestion.action_type.includes('draft')
                            ? 'Generate'
                            : 'Execute'}
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {suggestions.length === 0 && !error && (
        <div className="text-center py-8">
          <FileText size={32} className="mx-auto text-gray-400 mb-2" />
          <p className="text-gray-600">No actions suggested for this email</p>
        </div>
      )}
    </div>
  )
}
