'use client'

import { useState, useEffect } from 'react'

interface EmailInference {
  id: string
  senderIntent: string
  hiddenUrgency: boolean
  expectedResponse: string
  actualRequest: string
  actionItems: string[]
  missingInfo: string[]
  riskLevel: 'green' | 'yellow' | 'red'
  tone: string
  deadlinePressure: string | null
  actionRequired: string
  senderPatternMatch: string | null
  confidenceScore: number
}

interface EmailInferencePanelProps {
  emailId: string
  siteId: string
  emailText: string
  senderEmail: string
  onInferenceComplete?: (inference: EmailInference) => void
}

const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'red':
      return 'bg-red-100 text-red-800 border-red-300'
    case 'yellow':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    case 'green':
      return 'bg-green-100 text-green-800 border-green-300'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}

const getActionColor = (action: string) => {
  switch (action) {
    case 'escalation':
      return 'bg-red-100 text-red-700'
    case 'action':
      return 'bg-blue-100 text-blue-700'
    case 'reply':
      return 'bg-yellow-100 text-yellow-700'
    case 'documentation':
      return 'bg-gray-100 text-gray-700'
    default:
      return 'bg-green-100 text-green-700'
  }
}

export function EmailInferencePanel({
  emailId,
  siteId,
  emailText,
  senderEmail,
  onInferenceComplete,
}: EmailInferencePanelProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inference, setInference] = useState<EmailInference | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    analyzeEmail()
  }, [emailId])

  const analyzeEmail = async () => {
    if (!emailText.trim()) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/email/infer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailId,
          siteId,
          emailText,
          senderEmail,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze email')
      }

      const data = await response.json()
      setInference(data)
      onInferenceComplete?.(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An error occurred while analyzing the email'
      )
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Analyzing email with AI...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg shadow p-6 border-l-4 border-red-500">
        <h3 className="text-lg font-semibold text-red-900 mb-2">Analysis Error</h3>
        <p className="text-red-700">{error}</p>
        <button
          onClick={analyzeEmail}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!inference) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div className="flex items-start justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Email Inference Analysis</h2>
        <div className="flex gap-2">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(
              inference.riskLevel
            )}`}
          >
            Risk: {inference.riskLevel.toUpperCase()}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium border ${getActionColor(
              inference.actionRequired
            )}`}
          >
            {inference.actionRequired.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Confidence Score */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Analysis Confidence</span>
          <span className="text-lg font-bold text-blue-600">{inference.confidenceScore}%</span>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${inference.confidenceScore}%` }}
          ></div>
        </div>
      </div>

      {/* Sender Intent */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">Sender's Intent</h3>
        <p className="text-gray-700 bg-gray-50 p-3 rounded">{inference.senderIntent}</p>
      </div>

      {/* Actual Request */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">What They Actually Need</h3>
        <p className="text-gray-700 bg-gray-50 p-3 rounded">{inference.actualRequest}</p>
      </div>

      {/* Action Items */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">Action Items</h3>
        <ul className="space-y-2">
          {inference.actionItems.length > 0 ? (
            inference.actionItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 bg-blue-50 p-3 rounded">
                <span className="text-blue-600 font-bold flex-shrink-0">•</span>
                <span className="text-gray-700">{item}</span>
              </li>
            ))
          ) : (
            <p className="text-gray-500 italic">No specific action items identified</p>
          )}
        </ul>
      </div>

      {/* Communication Details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Tone</p>
          <p className="text-gray-900">{inference.tone}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Urgency</p>
          <p className="text-gray-900">{inference.hiddenUrgency ? 'HIGH' : 'Normal'}</p>
        </div>
        {inference.deadlinePressure && (
          <div className="bg-yellow-50 p-3 rounded col-span-2">
            <p className="text-xs font-semibold text-yellow-600 uppercase mb-1">Deadline</p>
            <p className="text-yellow-900">{inference.deadlinePressure}</p>
          </div>
        )}
      </div>

      {/* Missing Information */}
      {inference.missingInfo.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Missing Information</h3>
          <ul className="space-y-1">
            {inference.missingInfo.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-orange-700">
                <span className="text-orange-600 flex-shrink-0">⚠</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Expected Response */}
      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
        <p className="text-sm font-medium text-purple-900">
          <span className="font-bold">Expected Response:</span> {inference.expectedResponse}
        </p>
      </div>

      {/* Sender Pattern Match */}
      {inference.senderPatternMatch && (
        <div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-2"
          >
            <span>{showDetails ? '▼' : '▶'}</span>
            Sender Pattern History
          </button>
          {showDetails && (
            <div className="mt-2 p-3 bg-blue-50 rounded text-sm text-gray-700">
              {inference.senderPatternMatch}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
          Reply
        </button>
        <button className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition font-medium">
          Add to Calendar
        </button>
        <button className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition font-medium">
          Link to Project
        </button>
      </div>
    </div>
  )
}
