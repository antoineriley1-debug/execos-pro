'use client'

import React, { useState } from 'react'
import { useAuth } from '@/lib/auth'

interface SearchResult {
  id: string
  type: 'memory' | 'file'
  title: string
  preview: string
  tags?: string[]
  createdAt: string
  memoryType?: string
  fileType?: string
  fileSize?: number
  isPinned?: boolean
  isStarred?: boolean
}

export function UnifiedSearch() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sourceFilter, setSourceFilter] = useState<'all' | 'memory' | 'file'>('all')

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery)

    if (!searchQuery || searchQuery.length < 2) {
      setResults([])
      return
    }

    setIsLoading(true)
    try {
      const token = (await user?.getIdToken?.()) || ''
      const params = new URLSearchParams({
        q: searchQuery,
        ...(sourceFilter !== 'all' && { sourceType: sourceFilter }),
      })

      const response = await fetch(`/api/search/unified?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setResults(data.results || [])
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getResultIcon = (result: SearchResult) => {
    if (result.type === 'memory') {
      switch (result.memoryType) {
        case 'global':
          return '🌐'
        case 'site':
          return '🏢'
        case 'project':
          return '📋'
        case 'contact':
          return '👤'
        default:
          return '📝'
      }
    } else {
      switch (result.fileType) {
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
        case 'image':
          return '🖼️'
        default:
          return '📎'
      }
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return ' (' + (Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]) + ')'
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="space-y-4">
        {/* Search Input */}
        <div>
          <h1 className="text-3xl font-bold mb-4">Universal Search</h1>
          <input
            type="text"
            placeholder="Search memories and files..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => setSourceFilter('all')}
            className={`px-3 py-1 rounded-full text-sm transition ${
              sourceFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSourceFilter('memory')}
            className={`px-3 py-1 rounded-full text-sm transition ${
              sourceFilter === 'memory'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Memories
          </button>
          <button
            onClick={() => setSourceFilter('file')}
            className={`px-3 py-1 rounded-full text-sm transition ${
              sourceFilter === 'file'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Files
          </button>
        </div>

        {/* Results */}
        {isLoading && (
          <div className="text-center py-8">
            <p className="text-gray-500">Searching...</p>
          </div>
        )}

        {!isLoading && query.length > 0 && results.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No results found</p>
          </div>
        )}

        {!isLoading && results.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              {results.length} result{results.length !== 1 ? 's' : ''} found
            </p>
            {results.map((result) => (
              <SearchResultCard key={`${result.type}-${result.id}`} result={result} icon={getResultIcon(result)} formatFileSize={formatFileSize} />
            ))}
          </div>
        )}

        {!isLoading && query.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">🔍</p>
            <p>Start typing to search memories and files</p>
          </div>
        )}
      </div>
    </div>
  )
}

function SearchResultCard({
  result,
  icon,
  formatFileSize,
}: {
  result: SearchResult
  icon: string
  formatFileSize: (bytes?: number) => string
}) {
  const getBackgroundColor = (result: SearchResult) => {
    if (result.type === 'memory') {
      switch (result.memoryType) {
        case 'global':
          return 'bg-blue-50 border-blue-200'
        case 'site':
          return 'bg-yellow-50 border-yellow-200'
        case 'project':
          return 'bg-green-50 border-green-200'
        case 'contact':
          return 'bg-purple-50 border-purple-200'
        default:
          return 'bg-gray-50 border-gray-200'
      }
    } else {
      return 'bg-gray-50 border-gray-200'
    }
  }

  const getTypeLabel = (result: SearchResult) => {
    if (result.type === 'memory') {
      return `Memory · ${result.memoryType}`
    } else {
      return `File · ${result.fileType?.toUpperCase()}`
    }
  }

  return (
    <div className={`p-4 border rounded-lg cursor-pointer hover:shadow-md transition ${getBackgroundColor(result)}`}>
      <div className="flex gap-4">
        <div className="text-3xl">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800 text-lg truncate">
                {result.title}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {getTypeLabel(result)}
                {result.fileSize && formatFileSize(result.fileSize)}
              </p>
            </div>
            <div className="flex gap-1">
              {result.isPinned && <span className="text-lg">📌</span>}
              {result.isStarred && <span className="text-lg">⭐</span>}
            </div>
          </div>

          <p className="text-gray-700 text-sm mt-2 line-clamp-2">
            {result.preview}
          </p>

          {result.tags && result.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {result.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-gray-200 px-2 py-1 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-400 mt-2">
            {new Date(result.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  )
}
