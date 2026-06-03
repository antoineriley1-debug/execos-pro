'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface EmailSummary {
  id: string
  summary: string
  keyPoints: string[]
  actionItems: string[]
  sentiment: string
  confidence: number
}

export function EmailIntelModule() {
  const [emailText, setEmailText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<EmailSummary | null>(null)

  const handleAnalyze = async () => {
    if (!emailText.trim()) {
      setError('Please paste an email first')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Call our AI summarization API
      const response = await fetch('/api/analyze-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailText,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze email')
      }

      const data = await response.json()
      setSummary(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An error occurred while analyzing the email'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Email Intel</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Paste Email</h2>
          <textarea
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
            placeholder="Paste the full email here (including headers if available)"
            className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
          <button
            onClick={handleAnalyze}
            disabled={loading || !emailText.trim()}
            className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Analyze Email'}
          </button>
        </div>

        {/* Results Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">AI Summary</h2>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded mb-4">
              {error}
            </div>
          )}

          {summary ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Summary</h3>
                <p className="text-gray-600">{summary.summary}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Key Points</h3>
                <ul className="list-disc list-inside space-y-1">
                  {summary.keyPoints.map((point, idx) => (
                    <li key={idx} className="text-gray-600 text-sm">
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Action Items</h3>
                {summary.actionItems.length > 0 ? (
                  <ul className="space-y-1">
                    {summary.actionItems.map((item, idx) => (
                      <li key={idx} className="text-gray-600 text-sm flex items-start">
                        <span className="mr-2">→</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">No action items identified</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <span className="text-sm text-gray-700">Sentiment: </span>
                  <span
                    className={`font-semibold ${
                      summary.sentiment === 'positive'
                        ? 'text-green-600'
                        : summary.sentiment === 'negative'
                          ? 'text-red-600'
                          : 'text-gray-600'
                    }`}
                  >
                    {summary.sentiment}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-700">Confidence: </span>
                  <span className="font-semibold text-blue-600">
                    {(summary.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              Paste an email and click "Analyze Email" to see results
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
