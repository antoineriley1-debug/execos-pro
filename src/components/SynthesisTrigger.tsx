'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'

interface SynthesisTriggerProps {
  onComplete?: () => void
}

export function SynthesisTrigger({ onComplete }: SynthesisTriggerProps) {
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showMessage, setShowMessage] = useState(false)

  const isAdmin = user?.email?.includes('admin') || user?.role === 'admin'

  const handleTrigger = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    setShowMessage(true)

    try {
      const token = (await user?.getIdToken?.()) || ''
      if (!token) {
        throw new Error('Not authenticated')
      }

      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const response = await fetch('/api/synthesis/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          startDate: weekAgo.toISOString(),
          endDate: now.toISOString(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate synthesis')
      }

      const data = await response.json()
      setSuccess(
        `Synthesis generated successfully! (ID: ${data.synthesisId}) - ${data.dataProcessed?.emails || 0} emails, ${data.dataProcessed?.contracts || 0} contracts, ${data.dataProcessed?.events || 0} events`
      )

      onComplete?.()

      setTimeout(() => setShowMessage(false), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate synthesis')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return null
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="relative">
      <button
        onClick={handleTrigger}
        disabled={loading}
        className="bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-700 disabled:opacity-50 transition-colors flex items-center gap-2"
      >
        {loading ? (
          <>
            <span className="animate-spin">⏳</span>
            Generating...
          </>
        ) : (
          <>
            <span>🔄</span>
            Trigger Synthesis
          </>
        )}
      </button>

      {showMessage && (
        <div className="absolute top-full right-0 mt-2 w-96 z-50">
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg shadow-lg text-sm">
              <div className="font-medium mb-1">✓ Success</div>
              {success}
            </div>
          )}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg shadow-lg text-sm">
              <div className="font-medium mb-1">✗ Error</div>
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
