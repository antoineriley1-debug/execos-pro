'use client'

import React, { useState, useRef } from 'react'

interface EmailImportPanelProps {
  onMergeWithFiles: (emailContent: string) => void
  onCreateSeparateJob: (emailContent: string) => void
}

export function EmailImportPanel({
  onMergeWithFiles,
  onCreateSeparateJob,
}: EmailImportPanelProps) {
  const [emailText, setEmailText] = useState('')
  const [emailFiles, setEmailFiles] = useState<File[]>([])
  const [activeTab, setActiveTab] = useState<'paste' | 'eml' | 'msg'>('paste')
  const [error, setError] = useState('')
  const emlInputRef = useRef<HTMLInputElement>(null)
  const msgInputRef = useRef<HTMLInputElement>(null)

  const parseEmailMetadata = (text: string) => {
    const lines = text.split('\n')
    const metadata = {
      from: '',
      to: '',
      subject: '',
      date: '',
    }

    for (const line of lines) {
      if (line.startsWith('From:')) metadata.from = line.replace('From:', '').trim()
      if (line.startsWith('To:')) metadata.to = line.replace('To:', '').trim()
      if (line.startsWith('Subject:')) metadata.subject = line.replace('Subject:', '').trim()
      if (line.startsWith('Date:')) metadata.date = line.replace('Date:', '').trim()
    }

    return metadata
  }

  const handlePasteEmail = () => {
    if (!emailText.trim()) {
      setError('Please paste email content')
      return
    }
    setError('')
    onMergeWithFiles(emailText)
    setEmailText('')
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'eml' | 'msg') => {
    const files = e.target.files
    if (files) {
      const selected = Array.from(files)
      setEmailFiles([...emailFiles, ...selected])
      setError('')
    }
  }

  const handleRemoveEmailFile = (index: number) => {
    setEmailFiles(emailFiles.filter((_, i) => i !== index))
  }

  const handleProcessEmailFiles = () => {
    if (emailFiles.length === 0) {
      setError('No email files selected')
      return
    }
    setError('')
    // Merge with other files
    onMergeWithFiles(`Email files: ${emailFiles.map((f) => f.name).join(', ')}`)
    setEmailFiles([])
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(['paste', 'eml', 'msg'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === tab
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.toUpperCase()} {tab === 'eml' ? 'Files' : tab === 'msg' ? 'Outlook' : 'Email'}
          </button>
        ))}
      </div>

      {/* Paste Email Tab */}
      {activeTab === 'paste' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paste Email Thread
            </label>
            <textarea
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              placeholder="Paste entire email thread here (including headers for parsing)..."
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-2">
              Tip: Include From, To, Subject, Date headers for auto-parsing
            </p>
          </div>

          {emailText && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Detected Metadata</h4>
              <div className="space-y-1 text-sm">
                {Object.entries(parseEmailMetadata(emailText)).map(([key, value]) =>
                  value ? (
                    <div key={key}>
                      <span className="font-medium text-gray-600 capitalize">{key}:</span>{' '}
                      <span className="text-gray-700 break-words">{value}</span>
                    </div>
                  ) : null
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handlePasteEmail}
              disabled={!emailText.trim()}
              className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              Merge with Files
            </button>
            <button
              onClick={() => setEmailText('')}
              className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2 rounded-lg transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* EML Files Tab */}
      {activeTab === 'eml' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload .eml Files
            </label>
            <input
              ref={emlInputRef}
              type="file"
              multiple
              accept=".eml"
              onChange={(e) => handleFileSelect(e, 'eml')}
              className="hidden"
            />
            <button
              onClick={() => emlInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 hover:border-amber-400 rounded-lg p-6 text-center hover:bg-amber-50 transition-colors"
            >
              <p className="text-gray-600">Click to select .eml files</p>
            </button>
          </div>

          {emailFiles.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Selected Files</p>
              <div className="space-y-2">
                {emailFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">📧</span>
                      <span className="text-sm text-gray-700">{file.name}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveEmailFile(index)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {emailFiles.length > 0 && (
            <button
              onClick={handleProcessEmailFiles}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              Merge {emailFiles.length} File(s) with Investigation
            </button>
          )}
        </div>
      )}

      {/* MSG Files Tab */}
      {activeTab === 'msg' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Outlook .msg Files
            </label>
            <input
              ref={msgInputRef}
              type="file"
              multiple
              accept=".msg"
              onChange={(e) => handleFileSelect(e, 'msg')}
              className="hidden"
            />
            <button
              onClick={() => msgInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 hover:border-amber-400 rounded-lg p-6 text-center hover:bg-amber-50 transition-colors"
            >
              <p className="text-gray-600">Click to select .msg files</p>
            </button>
          </div>

          {emailFiles.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Selected Files</p>
              <div className="space-y-2">
                {emailFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">📧</span>
                      <span className="text-sm text-gray-700">{file.name}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveEmailFile(index)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {emailFiles.length > 0 && (
            <button
              onClick={handleProcessEmailFiles}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              Merge {emailFiles.length} File(s) with Investigation
            </button>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  )
}
