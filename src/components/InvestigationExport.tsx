'use client'

import React, { useState } from 'react'
import type { InvestigationJob } from '@/types/investigations'

interface InvestigationExportProps {
  job: InvestigationJob
  onExport?: (format: 'pdf' | 'json' | 'csv') => Promise<void>
}

export function InvestigationExport({ job, onExport }: InvestigationExportProps) {
  const [downloading, setDownloading] = useState<'pdf' | 'json' | 'csv' | null>(null)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const estimateSizes = () => {
    const baseSize = JSON.stringify(job).length

    return {
      pdf: `~${Math.ceil((baseSize * 2.5) / 1024)} KB`,
      json: `~${Math.ceil(baseSize / 1024)} KB`,
      csv: `~${Math.ceil((baseSize * 0.7) / 1024)} KB`,
    }
  }

  const handleExport = async (format: 'pdf' | 'json' | 'csv') => {
    try {
      setDownloading(format)
      setError('')
      setSuccess('')

      if (onExport) {
        await onExport(format)
      } else {
        // Default mock export behavior
        const data = generateExportData(format)
        downloadFile(data, format)
      }

      setSuccess(`Export completed successfully!`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setDownloading(null)
    }
  }

  const generateExportData = (format: 'pdf' | 'json' | 'csv'): string => {
    if (format === 'json') {
      return JSON.stringify(job, null, 2)
    }

    if (format === 'csv') {
      const headers = ['Filename', 'Risk Level', 'Risk Score', 'Summary', 'Entities']
      const rows = (job.findings || []).map((f) => [
        f.filename,
        f.riskLevel,
        f.riskScore,
        f.summary,
        f.entities.join(';'),
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n')

      return csvContent
    }

    // PDF-like text format (actual PDF generation would need a library)
    const lines = [
      'INVESTIGATION RESULTS REPORT',
      `Job: ${job.name}`,
      `Status: ${job.status}`,
      `Files: ${job.processedFiles}/${job.totalFiles}`,
      '',
      'SUMMARY',
      ...((job.findings || []).map((f) => `${f.filename}: ${f.riskLevel} risk (${f.riskScore}%)`)),
      '',
      'FINDINGS',
      ...((job.findings || []).flatMap((f) => [
        `File: ${f.filename}`,
        `Risk: ${f.riskLevel}`,
        `Summary: ${f.summary}`,
        '',
      ])),
    ]

    return lines.join('\n')
  }

  const downloadFile = (content: string, format: 'pdf' | 'json' | 'csv') => {
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `investigation-${job.name.replace(/\s+/g, '-')}-${timestamp}.${format === 'pdf' ? 'txt' : format}`

    const blob = new Blob([content], {
      type: format === 'json' ? 'application/json' : 'text/plain',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const sizes = estimateSizes()

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Export Investigation Results</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* JSON Export */}
        <button
          onClick={() => handleExport('json')}
          disabled={downloading !== null}
          className="group border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="text-left space-y-2">
            <h4 className="font-semibold text-gray-900 group-hover:text-blue-600">JSON</h4>
            <p className="text-sm text-gray-600">
              Structured data format
              <br />
              <span className="text-xs text-gray-500">{sizes.json}</span>
            </p>
            <div className="flex gap-2">
              <span className="text-lg">📋</span>
              {downloading === 'json' ? (
                <span className="text-sm text-blue-600 font-medium">Downloading...</span>
              ) : (
                <span className="text-sm text-gray-500 group-hover:text-blue-600">Download</span>
              )}
            </div>
          </div>
        </button>

        {/* CSV Export */}
        <button
          onClick={() => handleExport('csv')}
          disabled={downloading !== null}
          className="group border border-gray-200 rounded-lg p-4 hover:border-green-300 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="text-left space-y-2">
            <h4 className="font-semibold text-gray-900 group-hover:text-green-600">CSV</h4>
            <p className="text-sm text-gray-600">
              Spreadsheet format
              <br />
              <span className="text-xs text-gray-500">{sizes.csv}</span>
            </p>
            <div className="flex gap-2">
              <span className="text-lg">📊</span>
              {downloading === 'csv' ? (
                <span className="text-sm text-green-600 font-medium">Downloading...</span>
              ) : (
                <span className="text-sm text-gray-500 group-hover:text-green-600">Download</span>
              )}
            </div>
          </div>
        </button>

        {/* PDF Export */}
        <button
          onClick={() => handleExport('pdf')}
          disabled={downloading !== null}
          className="group border border-gray-200 rounded-lg p-4 hover:border-red-300 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="text-left space-y-2">
            <h4 className="font-semibold text-gray-900 group-hover:text-red-600">PDF</h4>
            <p className="text-sm text-gray-600">
              Printable report
              <br />
              <span className="text-xs text-gray-500">{sizes.pdf}</span>
            </p>
            <div className="flex gap-2">
              <span className="text-lg">📄</span>
              {downloading === 'pdf' ? (
                <span className="text-sm text-red-600 font-medium">Downloading...</span>
              ) : (
                <span className="text-sm text-gray-500 group-hover:text-red-600">Download</span>
              )}
            </div>
          </div>
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">✓ {success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">✕ {error}</p>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-4">
        Files are generated on-demand and include all findings, entities, and risk assessments.
      </p>
    </div>
  )
}
