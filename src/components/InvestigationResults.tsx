'use client'

import React, { useState } from 'react'
import type { InvestigationJob, RiskLevel } from '@/types/investigations'

interface InvestigationResultsProps {
  job: InvestigationJob
  onClose: () => void
}

export function InvestigationResults({ job, onClose }: InvestigationResultsProps) {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set())

  if (!job.findings || job.findings.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <p className="text-gray-600 text-center py-8">No findings available</p>
      </div>
    )
  }

  const findings = job.findings
  const avgRisk = Math.round(findings.reduce((sum, f) => sum + f.riskScore, 0) / findings.length)
  const highRiskCount = findings.filter((f) => f.riskLevel === 'high').length
  const allEntities = [...new Set(findings.flatMap((f) => f.entities))].slice(0, 10)

  const toggleExpandFile = (filename: string) => {
    const newExpanded = new Set(expandedFiles)
    if (newExpanded.has(filename)) {
      newExpanded.delete(filename)
    } else {
      newExpanded.add(filename)
    }
    setExpandedFiles(newExpanded)
  }

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case 'low':
        return 'text-green-700 bg-green-50 border-green-200'
      case 'medium':
        return 'text-amber-700 bg-amber-50 border-amber-200'
      case 'high':
        return 'text-red-700 bg-red-50 border-red-200'
    }
  }

  const getSentimentEmoji = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return '😊'
      case 'negative':
        return '😞'
      default:
        return '😐'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Investigation Results</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-2xl"
        >
          ✕
        </button>
      </div>

      {/* Summary Section */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-600">Total Files</p>
            <p className="text-2xl font-bold text-gray-900">{findings.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Avg Risk Score</p>
            <p className="text-2xl font-bold text-amber-600">{avgRisk}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">High Risk Files</p>
            <p className="text-2xl font-bold text-red-600">{highRiskCount}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Entities Found</p>
            <p className="text-2xl font-bold text-blue-600">{allEntities.length}</p>
          </div>
        </div>
      </div>

      {/* Top Risks */}
      {highRiskCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="font-semibold text-red-900 mb-4">⚠️ Top Risks</h3>
          <div className="space-y-3">
            {findings
              .filter((f) => f.riskLevel === 'high')
              .map((finding) => (
                <div
                  key={finding.filename}
                  className="bg-white border border-red-200 rounded-lg p-4"
                >
                  <p className="font-medium text-gray-900">{finding.filename}</p>
                  <p className="text-sm text-red-700 mt-2">{finding.summary}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Common Themes */}
      {job.commonThemes && job.commonThemes.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Common Themes</h3>
          <div className="flex flex-wrap gap-2">
            {job.commonThemes.map((theme) => (
              <span
                key={theme}
                className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-medium border border-amber-200"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Key Entities */}
      {allEntities.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Key Entities</h3>
          <div className="flex flex-wrap gap-2">
            {allEntities.map((entity) => (
              <span
                key={entity}
                className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium border border-blue-200"
              >
                {entity}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Files List */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Detailed Findings</h3>
        <div className="space-y-3">
          {findings.map((finding) => {
            const isExpanded = expandedFiles.has(finding.filename)
            return (
              <div
                key={finding.filename}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* File Header */}
                <button
                  onClick={() => toggleExpandFile(finding.filename)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 text-left">
                    <span>📄</span>
                    <div>
                      <p className="font-medium text-gray-900">{finding.filename}</p>
                      <p className="text-sm text-gray-600 mt-1">{finding.summary}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={`px-3 py-1 rounded-full border text-sm font-semibold ${getRiskColor(finding.riskLevel)}`}
                    >
                      {finding.riskLevel.toUpperCase()} ({finding.riskScore}%)
                    </div>
                    <span className="text-gray-400">{isExpanded ? '▼' : '▶'}</span>
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-4">
                    {/* Key Findings */}
                    {finding.keyFindings.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Key Findings</h4>
                        <ul className="space-y-1">
                          {finding.keyFindings.map((f, idx) => (
                            <li
                              key={idx}
                              className="text-sm text-gray-700 flex gap-2"
                            >
                              <span className="text-amber-500">•</span>
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Sentiment */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Sentiment</h4>
                      <p className="text-sm text-gray-700">
                        {getSentimentEmoji(finding.sentiment)} {finding.sentiment}
                      </p>
                    </div>

                    {/* Entities */}
                    {finding.entities.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Entities</h4>
                        <div className="flex flex-wrap gap-2">
                          {finding.entities.map((entity) => (
                            <span
                              key={entity}
                              className="inline-flex px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-medium"
                            >
                              {entity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
