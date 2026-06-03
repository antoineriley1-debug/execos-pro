'use client'

import React, { useState, useRef } from 'react'

interface BulkUploadDropzoneProps {
  onUpload: (jobName: string, files: File[]) => Promise<void>
  isUploading?: boolean
  uploadProgress?: number
}

const ACCEPTED_TYPES = ['.pdf', '.docx', '.doc', '.txt', '.eml', '.msg']

export function BulkUploadDropzone({
  onUpload,
  isUploading = false,
  uploadProgress = 0,
}: BulkUploadDropzoneProps) {
  const [files, setFiles] = useState<File[]>([])
  const [jobName, setJobName] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFiles = (filesToValidate: File[]): boolean => {
    setError('')
    for (const file of filesToValidate) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!ACCEPTED_TYPES.includes(ext)) {
        setError(`Invalid file type: ${file.name}. Accepted: ${ACCEPTED_TYPES.join(', ')}`)
        return false
      }
      if (file.size > 100 * 1024 * 1024) {
        setError(`File too large: ${file.name}. Max 100MB per file.`)
        return false
      }
    }
    return true
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    if (validateFiles(droppedFiles)) {
      setFiles([...files, ...droppedFiles])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      if (validateFiles(selectedFiles)) {
        setFiles([...files, ...selectedFiles])
      }
    }
  }

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleClearFiles = () => {
    setFiles([])
    setError('')
  }

  const handleUpload = async () => {
    if (!jobName.trim()) {
      setError('Job name is required')
      return
    }
    if (files.length === 0) {
      setError('No files selected')
      return
    }

    try {
      await onUpload(jobName, files)
      setJobName('')
      handleClearFiles()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  return (
    <div className="space-y-4">
      {/* Job Name Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Investigation Job Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={jobName}
          onChange={(e) => setJobName(e.target.value)}
          placeholder="e.g., Vendor Compliance Review"
          disabled={isUploading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100"
        />
      </div>

      {/* Dropzone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-amber-500 bg-amber-50'
            : 'border-gray-300 bg-gray-50 hover:border-amber-400'
        } ${isUploading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          disabled={isUploading}
          accept={ACCEPTED_TYPES.join(',')}
          className="hidden"
        />

        <div className="space-y-2">
          <div className="text-2xl">📁</div>
          <p className="font-semibold text-gray-700">Drag and drop files here</p>
          <p className="text-sm text-gray-600">or click to browse</p>
          <p className="text-xs text-gray-500 mt-3">
            Supported: PDF, DOCX, TXT, EML, MSG (max 100MB each)
          </p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-700">
              Files to Upload ({files.length})
            </h3>
            <button
              onClick={handleClearFiles}
              disabled={isUploading}
              className="text-sm text-gray-600 hover:text-red-500 disabled:text-gray-400"
            >
              Clear
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded border border-gray-200"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-gray-500">📄</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveFile(index)}
                  disabled={isUploading}
                  className="ml-2 text-gray-400 hover:text-red-500 disabled:text-gray-300"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Progress Bar */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-gray-700">Uploading...</p>
            <span className="text-sm text-gray-600">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-amber-500 h-2 rounded-full transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={isUploading || files.length === 0 || !jobName.trim()}
        className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors"
      >
        {isUploading ? 'Uploading...' : 'Start Investigation'}
      </button>
    </div>
  )
}
