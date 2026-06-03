'use client'

import React, { useState, useRef } from 'react'
import { useAuth } from '@/lib/auth'

interface UploadedFile {
  id: string
  filename: string
  file_type: string
  file_size: number
  uploaded_at: string
  ai_summary?: string
  is_starred: boolean
  linked_site_id?: string
  linked_project_id?: string
}

interface UploadProgress {
  filename: string
  progress: number
  status: 'uploading' | 'completed' | 'failed'
  error?: string
}

export function FileUploadManager() {
  const { user } = useAuth()
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadFiles = async () => {
    setIsLoading(true)
    try {
      const token = (await user?.getIdToken?.()) || ''
      const response = await fetch('/api/files', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setFiles(data.data || [])
      }
    } catch (error) {
      console.error('Failed to load files:', error)
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    if (user) {
      loadFiles()
    }
  }, [user])

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('ring-2', 'ring-blue-400')
    }

    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFileUpload(droppedFiles)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add('ring-2', 'ring-blue-400')
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('ring-2', 'ring-blue-400')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    handleFileUpload(selectedFiles)
  }

  const handleFileUpload = async (filesToUpload: File[]) => {
    for (const file of filesToUpload) {
      const uploadKey = file.name
      setUploads((prev) => [
        ...prev,
        { filename: file.name, progress: 0, status: 'uploading' },
      ])

      try {
        const formData = new FormData()
        formData.append('file', file)

        const token = (await user?.getIdToken?.()) || ''
        const response = await fetch('/api/files/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        })

        if (response.status === 409) {
          // Duplicate detected
          setUploads((prev) =>
            prev.map((u) =>
              u.filename === uploadKey
                ? { ...u, status: 'failed', error: 'File already exists' }
                : u
            )
          )
        } else if (response.ok) {
          const data = await response.json()
          setFiles((prev) => [data, ...prev])
          setUploads((prev) =>
            prev.map((u) =>
              u.filename === uploadKey
                ? { ...u, progress: 100, status: 'completed' }
                : u
            )
          )

          // Auto-remove from progress after 3 seconds
          setTimeout(() => {
            setUploads((prev) => prev.filter((u) => u.filename !== uploadKey))
          }, 3000)
        } else {
          const error = await response.json()
          setUploads((prev) =>
            prev.map((u) =>
              u.filename === uploadKey
                ? {
                    ...u,
                    status: 'failed',
                    error: error.error || 'Upload failed',
                  }
                : u
            )
          )
        }
      } catch (error: any) {
        setUploads((prev) =>
          prev.map((u) =>
            u.filename === uploadKey
              ? { ...u, status: 'failed', error: error.message }
              : u
          )
        )
      }
    }
  }

  const handleDeleteFile = async (id: string) => {
    if (!confirm('Delete this file?')) return

    try {
      const token = (await user?.getIdToken?.()) || ''
      const response = await fetch(`/api/files/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== id))
        setSelectedFile(null)
      }
    } catch (error) {
      console.error('Failed to delete file:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return '📄'
      case 'doc':
      case 'docx':
        return '📝'
      case 'xlsx':
      case 'xls':
        return '📊'
      case 'csv':
        return '📋'
      case 'txt':
        return '📃'
      case 'image':
      case 'jpg':
      case 'png':
      case 'gif':
        return '🖼️'
      default:
        return '📎'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">File Management</h1>
        <p className="text-gray-600">Upload, organize, and manage your documents</p>
      </div>

      {/* Upload Zone */}
      <div
        ref={dropZoneRef}
        onDrop={handleFileDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-400 transition"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="space-y-2">
          <p className="text-4xl">📁</p>
          <p className="text-lg font-semibold text-gray-700">
            Drop files here or click to browse
          </p>
          <p className="text-sm text-gray-500">
            PDF, Word, Excel, CSV, images (max 100MB)
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.gif,.webp"
        />
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="font-bold text-gray-800">Uploads ({uploads.length})</h2>
          {uploads.map((upload) => (
            <div key={upload.filename} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {upload.filename}
                </span>
                <span className="text-xs text-gray-500">{upload.progress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    upload.status === 'completed'
                      ? 'bg-green-500'
                      : upload.status === 'failed'
                        ? 'bg-red-500'
                        : 'bg-blue-500'
                  }`}
                  style={{ width: `${upload.progress}%` }}
                />
              </div>
              {upload.error && (
                <p className="text-xs text-red-600">{upload.error}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Files List & Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Files List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <h2 className="font-semibold text-gray-800">
                {isLoading ? 'Loading...' : `${files.length} Files`}
              </h2>
            </div>
            <div className="max-h-[600px] overflow-y-auto space-y-2 p-4">
              {files.map((file) => (
                <div
                  key={file.id}
                  onClick={() => setSelectedFile(file)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition ${
                    selectedFile?.id === file.id
                      ? 'ring-2 ring-blue-500 border-blue-300'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xl">
                      {getFileIcon(file.file_type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate text-sm">
                        {file.filename}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.file_size)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(file.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                    {file.is_starred && <span className="text-lg">⭐</span>}
                  </div>
                </div>
              ))}
              {files.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No files uploaded yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* File Detail */}
        <div className="lg:col-span-2">
          {selectedFile ? (
            <FileDetailView
              file={selectedFile}
              onDelete={() => handleDeleteFile(selectedFile.id)}
              onRefresh={loadFiles}
            />
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              <p>Select a file to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FileDetailView({
  file,
  onDelete,
  onRefresh: _onRefresh,
}: {
  file: UploadedFile
  onDelete: () => void
  onRefresh: () => void
}) {
  const { user } = useAuth()
  const [isStarred, setIsStarred] = useState(file.is_starred)

  const handleToggleStar = async () => {
    try {
      const token = (await user?.getIdToken?.()) || ''
      const response = await fetch(`/api/files/${file.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isStarred: !isStarred }),
      })

      if (response.ok) {
        setIsStarred(!isStarred)
      }
    } catch (error) {
      console.error('Failed to toggle star:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{file.filename}</h2>
          <p className="text-sm text-gray-500 mt-1">
            Uploaded {new Date(file.uploaded_at).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={handleToggleStar}
          className={`text-3xl transition ${
            isStarred ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'
          }`}
        >
          ⭐
        </button>
      </div>

      <div className="pt-4 border-t space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">File Type</p>
            <p className="font-semibold text-gray-800">{file.file_type.toUpperCase()}</p>
          </div>
          <div>
            <p className="text-gray-500">File Size</p>
            <p className="font-semibold text-gray-800">
              {formatFileSize(file.file_size)}
            </p>
          </div>
        </div>
      </div>

      {file.ai_summary && (
        <div className="pt-4 border-t">
          <h3 className="font-semibold text-gray-800 mb-2">AI Summary</h3>
          <p className="text-gray-700 text-sm">{file.ai_summary}</p>
        </div>
      )}

      <div className="pt-4 border-t space-y-2">
        <p className="text-sm text-gray-600">
          <span className="font-semibold">Linked Site:</span>{' '}
          {file.linked_site_id || 'None'}
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-semibold">Linked Project:</span>{' '}
          {file.linked_project_id || 'None'}
        </p>
      </div>

      <div className="pt-4 border-t space-y-2">
        <a
          href={`/api/files/${file.id}/download`}
          className="block w-full px-4 py-2 bg-blue-600 text-white text-center rounded hover:bg-blue-700 transition"
        >
          Download
        </a>
        <button
          onClick={onDelete}
          className="w-full px-4 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
