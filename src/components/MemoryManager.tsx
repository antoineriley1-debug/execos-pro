'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'

interface MemoryEntry {
  id: string
  title: string
  content: string
  memory_type: string
  site_id?: string
  project_id?: string
  tags: string[]
  is_pinned: boolean
  created_at: string
  updated_at: string
  access_count: number
}

interface MemorySite {
  id: string
  name: string
}

export function MemoryManager() {
  const { user } = useAuth()
  const [memoryType, setMemoryType] = useState<
    'global' | 'site' | 'project' | 'contact'
  >('global')
  const [selectedSite, setSelectedSite] = useState<string>('')
  const [sites, setSites] = useState<MemorySite[]>([])
  const [memories, setMemories] = useState<MemoryEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMemory, setSelectedMemory] = useState<MemoryEntry | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      loadSites()
      loadMemories()
    }
  }, [user, memoryType, selectedSite])

  const loadSites = async () => {
    try {
      const token = (await user?.getIdToken?.()) || ''
      const response = await fetch('/api/sites', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setSites(data.data || [])
        if (data.data?.length > 0 && !selectedSite) {
          setSelectedSite(data.data[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to load sites:', error)
    }
  }

  const loadMemories = async () => {
    setIsLoading(true)
    try {
      const token = (await user?.getIdToken?.()) || ''
      const params = new URLSearchParams({
        type: memoryType,
        ...(selectedSite && memoryType === 'site' && { siteId: selectedSite }),
        ...(searchQuery && { search: searchQuery }),
      })

      const response = await fetch(`/api/memory?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setMemories(data.data || [])
      }
    } catch (error) {
      console.error('Failed to load memories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateMemory = async (title: string, content: string) => {
    try {
      const token = (await user?.getIdToken?.()) || ''
      const response = await fetch('/api/memory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          memoryType,
          title,
          content,
          siteId: selectedSite && memoryType === 'site' ? selectedSite : null,
        }),
      })

      if (response.ok) {
        setIsCreating(false)
        loadMemories()
      }
    } catch (error) {
      console.error('Failed to create memory:', error)
    }
  }

  const handleDeleteMemory = async (id: string) => {
    if (!confirm('Delete this memory entry?')) return

    try {
      const token = (await user?.getIdToken?.()) || ''
      const response = await fetch(`/api/memory/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        loadMemories()
        setSelectedMemory(null)
      }
    } catch (error) {
      console.error('Failed to delete memory:', error)
    }
  }

  const getMemoryColor = (type: string) => {
    switch (type) {
      case 'global':
        return 'bg-blue-100 border-blue-300'
      case 'site':
        return 'bg-yellow-100 border-yellow-300'
      case 'project':
        return 'bg-green-100 border-green-300'
      case 'contact':
        return 'bg-purple-100 border-purple-300'
      default:
        return 'bg-gray-100 border-gray-300'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Memory Management</h1>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Memory Type Selector */}
          <select
            value={memoryType}
            onChange={(e) => {
              setMemoryType(
                e.target.value as 'global' | 'site' | 'project' | 'contact'
              )
              setSelectedMemory(null)
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="global">Global Memory</option>
            <option value="site">Site Memory</option>
            <option value="project">Project Memory</option>
            <option value="contact">Contact Memory</option>
          </select>

          {/* Site Selector */}
          {memoryType === 'site' && (
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a site...</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          )}

          {/* Search */}
          <input
            type="text"
            placeholder="Search memories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyUp={(e) => {
              if (e.key === 'Enter') loadMemories()
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Create Button */}
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            + New Memory
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Memory List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <h2 className="font-semibold text-gray-800">
                {isLoading ? 'Loading...' : `${memories.length} Entries`}
              </h2>
            </div>
            <div className="max-h-[600px] overflow-y-auto space-y-2 p-4">
              {memories.map((memory) => (
                <div
                  key={memory.id}
                  onClick={() => setSelectedMemory(memory)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition ${
                    selectedMemory?.id === memory.id
                      ? 'ring-2 ring-blue-500'
                      : ''
                  } ${getMemoryColor(memory.memory_type)}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {memory.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {memory.content}
                      </p>
                    </div>
                    {memory.is_pinned && <span className="text-lg">📌</span>}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {memory.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-gray-200 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Accessed {memory.access_count}x
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detail View */}
        <div className="lg:col-span-2">
          {selectedMemory ? (
            <MemoryDetailView
              memory={selectedMemory}
              onDelete={() => handleDeleteMemory(selectedMemory.id)}
              onRefresh={loadMemories}
            />
          ) : isCreating ? (
            <MemoryCreateForm
              onSave={handleCreateMemory}
              onCancel={() => setIsCreating(false)}
            />
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              <p>Select a memory entry to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MemoryDetailView({
  memory,
  onDelete,
  onRefresh,
}: {
  memory: MemoryEntry
  onDelete: () => void
  onRefresh: () => void
}) {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(memory.title)
  const [content, setContent] = useState(memory.content)

  const handleSave = async () => {
    try {
      const token = (await user?.getIdToken?.()) || ''
      const response = await fetch(`/api/memory/${memory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content }),
      })

      if (response.ok) {
        setIsEditing(false)
        onRefresh()
      }
    } catch (error) {
      console.error('Failed to update memory:', error)
    }
  }

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{memory.title}</h2>
          <p className="text-sm text-gray-500 mt-1">
            Created {new Date(memory.created_at).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
        >
          Edit
        </button>
      </div>

      <div className="prose max-w-none">
        <p className="text-gray-700 whitespace-pre-wrap">{memory.content}</p>
      </div>

      <div className="pt-4 border-t space-y-2">
        <div className="flex gap-2 flex-wrap">
          {memory.tags.map((tag) => (
            <span key={tag} className="bg-gray-200 px-3 py-1 rounded-full text-sm">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t text-sm text-gray-500 space-y-1">
        <p>Type: <span className="font-semibold">{memory.memory_type}</span></p>
        <p>Accessed: <span className="font-semibold">{memory.access_count} times</span></p>
        <p>Last updated: {new Date(memory.updated_at).toLocaleDateString()}</p>
      </div>

      <button
        onClick={onDelete}
        className="w-full mt-4 px-4 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
      >
        Delete
      </button>
    </div>
  )
}

function MemoryCreateForm({
  onSave,
  onCancel,
}: {
  onSave: (title: string, content: string) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Create New Memory</h2>
      <input
        type="text"
        placeholder="Memory title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <textarea
        placeholder="Memory content..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={12}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="flex gap-2">
        <button
          onClick={() => onSave(title, content)}
          disabled={!title || !content}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Create Memory
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
