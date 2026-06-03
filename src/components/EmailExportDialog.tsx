import { useState } from 'react'
import { X, Download, Loader } from 'lucide-react'

interface EmailExportDialogProps {
  emailId: string
  emailSubject: string
  isOpen: boolean
  onClose: () => void
  onExportComplete?: (result: any) => void
}

type ExportFormat = 'pdf' | 'docx' | 'txt' | 'json' | 'csv' | 'md' | 'html'

export function EmailExportDialog({
  emailId,
  emailSubject,
  isOpen,
  onClose,
  onExportComplete,
}: EmailExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf')
  const [includeAttachments, setIncludeAttachments] = useState(false)
  const [includeFullAnalysis, setIncludeFullAnalysis] = useState(true)
  const [includeResponseTemplate, setIncludeResponseTemplate] = useState(true)
  const [exportName, setExportName] = useState(emailSubject)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatOptions = [
    { value: 'pdf' as ExportFormat, label: 'PDF (Professional Format)', description: 'Branded PDF with colors and formatting' },
    { value: 'docx' as ExportFormat, label: 'Word (Editable)', description: 'Fully editable Word document' },
    { value: 'txt' as ExportFormat, label: 'Plain Text', description: 'Simple text file' },
    { value: 'json' as ExportFormat, label: 'JSON (Data)', description: 'Structured JSON data' },
    { value: 'csv' as ExportFormat, label: 'CSV (Spreadsheet)', description: 'Excel/Sheets compatible' },
    { value: 'md' as ExportFormat, label: 'Markdown', description: 'Markdown documentation' },
    { value: 'html' as ExportFormat, label: 'HTML (Web)', description: 'Web-ready HTML' },
  ]

  const handleExport = async () => {
    if (!selectedFormat) return

    setIsExporting(true)
    setError(null)

    try {
      const response = await fetch('/api/emails/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailId,
          format: selectedFormat,
          includeAttachments,
          includeFullAnalysis,
          includeResponseTemplate,
          exportName: exportName || emailSubject,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Export failed')
      }

      const result = await response.json()

      // Trigger download
      if (result.fileUrl) {
        const a = document.createElement('a')
        a.href = result.fileUrl
        a.download = result.fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }

      onExportComplete?.(result)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Export Email Investigation</h2>
            <p className="text-sm text-gray-600 mt-1">Export this email analysis in your preferred format</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Export Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Name
            </label>
            <input
              type="text"
              value={exportName}
              onChange={(e) => setExportName(e.target.value)}
              placeholder="Email subject will be used if empty"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-1 gap-3">
              {formatOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                    selectedFormat === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="format"
                    value={option.value}
                    checked={selectedFormat === option.value}
                    onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">{option.label}</p>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Export Options
            </label>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeFullAnalysis}
                  onChange={(e) => setIncludeFullAnalysis(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Include full AI analysis (intent, risk, actions)
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeResponseTemplate}
                  onChange={(e) => setIncludeResponseTemplate(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Include recommended response template
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeAttachments}
                  onChange={(e) => setIncludeAttachments(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Include attachments (if any)
                </span>
              </label>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || !selectedFormat}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {isExporting ? (
              <>
                <Loader size={16} className="animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={16} />
                Export
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
