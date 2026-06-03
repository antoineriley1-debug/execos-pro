'use client'

import React from 'react'
import type { InvestigationJob } from '@/types/investigations'

interface InvestigationJobCardProps {
  job: InvestigationJob
  onViewResults: (job: InvestigationJob) => void
  onRetry: (jobId: string) => void
  onDelete: (jobId: string) => void
}

export function InvestigationJobCard({
  job,
  onViewResults,
  onRetry,
  onDelete,
}: InvestigationJobCardProps) {
  const statusColors = {
    pending: { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500' },
    analyzing: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      dot: 'bg-blue-500',
    },
    complete: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      dot: 'bg-green-500',
    },
    failed: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
  }

  const colors = statusColors[job.status]
  const progress = Math.round((job.processedFiles / job.totalFiles) * 100)
  const createdDate = new Date(job.createdAt).toLocaleString()
  const completedDate = job.completedAt
    ? new Date(job.completedAt).toLocaleString()
    : null

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{job.name}</h3>
          <p className="text-sm text-gray-500 mt-1">Created: {createdDate}</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${colors.bg}`}>
          <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
          <span className={`text-sm font-medium ${colors.text} capitalize`}>
            {job.status}
          </span>
        </div>
      </div>

      {/* File Progress */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Files Processed</span>
          <span className="text-sm text-gray-600">
            {job.processedFiles} of {job.totalFiles}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              job.status === 'failed'
                ? 'bg-red-500'
                : job.status === 'complete'
                  ? 'bg-green-500'
                  : 'bg-amber-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200">
        <div>
          <p className="text-xs text-gray-500">Total Files</p>
          <p className="text-lg font-semibold text-gray-900">{job.totalFiles}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Progress</p>
          <p className="text-lg font-semibold text-gray-900">{progress}%</p>
        </div>
      </div>

      {/* Error Message */}
      {job.errorMessage && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{job.errorMessage}</p>
        </div>
      )}

      {/* Completion Info */}
      {completedDate && (
        <p className="text-xs text-gray-500 mb-4">Completed: {completedDate}</p>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {job.status === 'complete' && (
          <button
            onClick={() => onViewResults(job)}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            View Results
          </button>
        )}

        {job.status === 'failed' && (
          <button
            onClick={() => onRetry(job.id)}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        )}

        <button
          onClick={() => onDelete(job.id)}
          className="flex-1 border border-red-300 hover:bg-red-50 text-red-600 font-semibold py-2 rounded-lg transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
