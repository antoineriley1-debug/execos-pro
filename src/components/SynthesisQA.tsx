'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/lib/auth'

interface QAEntry {
  id: string
  question: string
  answer: string
  tokensUsed?: {
    input: number
    output: number
    total: number
  }
}

interface SynthesisQAProps {
  synthesisId: string
}

export function SynthesisQA({ synthesisId }: SynthesisQAProps) {
  const { user } = useAuth()
  const [question, setQuestion] = useState('')
  const [qaHistory, setQaHistory] = useState<QAEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [qaHistory])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!question.trim()) {
      setError('Please enter a question')
      return
    }

    if (question.length > 2000) {
      setError('Question must be less than 2000 characters')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const token = (await user?.getIdToken?.()) || ''
      if (!token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/api/synthesis/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          synthesisId,
          question,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to get answer')
      }

      const data = await response.json()

      setQaHistory([
        ...qaHistory,
        {
          id: data.queryId || Date.now().toString(),
          question,
          answer: data.answer,
          tokensUsed: data.tokensUsed,
        },
      ])

      setQuestion('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get answer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Ask Questions</h3>

      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about this synthesis (max 2000 characters)..."
            disabled={loading}
            className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 resize-none text-sm"
          />
          <div className="text-xs text-gray-500 mt-1">
            {question.length}/2000
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Analyzing...' : 'Ask Question'}
        </button>
      </form>

      {qaHistory.length > 0 && (
        <div className="space-y-4 border-t pt-6">
          <h4 className="font-semibold text-gray-900">Q&A History</h4>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {qaHistory.map((entry) => (
              <div key={entry.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-sm font-semibold text-blue-600">Q:</span>
                  <p className="text-sm text-gray-900">{entry.question}</p>
                </div>

                <div className="flex items-start gap-2 mb-2">
                  <span className="text-sm font-semibold text-green-600">A:</span>
                  <p className="text-sm text-gray-700 leading-relaxed">{entry.answer}</p>
                </div>

                {entry.tokensUsed && (
                  <div className="text-xs text-gray-500 pt-2 border-t border-gray-200 mt-2">
                    Tokens: {entry.tokensUsed.total} (in: {entry.tokensUsed.input}, out:{' '}
                    {entry.tokensUsed.output})
                  </div>
                )}
              </div>
            ))}
          </div>

          <div ref={scrollRef} />
        </div>
      )}
    </div>
  )
}
