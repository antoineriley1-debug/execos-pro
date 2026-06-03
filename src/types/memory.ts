/**
 * Memory & File Management Types
 */

// ============================================================================
// MEMORY TYPES
// ============================================================================

export type MemoryType = 'global' | 'site' | 'project' | 'contact'
export type MemoryAccessLevel = 'private' | 'team' | 'public'

export interface MemoryEntry {
  id: string
  user_id: string
  memory_type: MemoryType
  site_id?: string
  project_id?: string
  contact_id?: string
  title: string
  content: string
  tags: string[]
  is_pinned: boolean
  is_archived: boolean
  created_at: string
  updated_at: string
  last_accessed_at?: string
  access_count: number
}

export interface MemoryTag {
  id: string
  user_id: string
  tag_name: string
  tag_color: string
  memory_count: number
  created_at: string
}

export interface MemoryFileLink {
  id: string
  memory_id: string
  file_id: string
  created_at: string
}

export interface MemoryEntryRequest {
  memoryType: MemoryType
  title: string
  content: string
  tags?: string[]
  siteId?: string
  projectId?: string
  contactId?: string
}

export interface MemoryEntryUpdate {
  title?: string
  content?: string
  tags?: string[]
  isPinned?: boolean
  isArchived?: boolean
}

// ============================================================================
// FILE TYPES
// ============================================================================

export type FileType =
  | 'pdf'
  | 'doc'
  | 'docx'
  | 'xlsx'
  | 'xls'
  | 'csv'
  | 'txt'
  | 'image'
  | 'jpg'
  | 'png'
  | 'gif'
  | 'other'

export interface Document {
  id: string
  user_id: string
  filename: string
  file_type: FileType
  file_url: string
  file_size: number
  file_hash: string
  uploaded_at: string
  linked_project_id?: string
  linked_site_id?: string
  linked_contract_id?: string
  extracted_text?: string
  ai_summary?: string
  ai_tags: string[]
  is_starred: boolean
  created_at: string
  updated_at: string
}

export interface FileUpload {
  id: string
  user_id: string
  filename: string
  status: 'uploading' | 'completed' | 'failed'
  progress_percent: number
  file_size: number
  error_message?: string
  created_at: string
  completed_at?: string
}

export interface FileFolder {
  id: string
  user_id: string
  site_id?: string
  folder_name: string
  folder_path: string
  created_at: string
  updated_at: string
}

export interface DocumentUploadRequest {
  file: File
  linkedProjectId?: string
  linkedSiteId?: string
  linkedContractId?: string
}

export interface DocumentUpdateRequest {
  filename?: string
  aiTags?: string[]
  isStarred?: boolean
  linkedProjectId?: string
  linkedSiteId?: string
}

// ============================================================================
// SEARCH TYPES
// ============================================================================

export type SearchSourceType = 'memory' | 'file' | 'both'

export interface UnifiedSearchResult {
  id: string
  type: 'memory' | 'file'
  title: string
  preview: string
  tags?: string[]
  createdAt: string
  memoryType?: MemoryType
  fileType?: FileType
  fileSize?: number
  isPinned?: boolean
  isStarred?: boolean
}

export interface UnifiedSearchRequest {
  q: string
  sourceType?: SearchSourceType
  tags?: string[]
  limit?: number
}

export interface UnifiedSearchResponse {
  results: UnifiedSearchResult[]
  total: number
  query: string
}

// ============================================================================
// INTEGRATION TYPES
// ============================================================================

export interface MemoryContext {
  globalMemories: MemoryEntry[]
  siteMemories: Map<string, MemoryEntry[]>
  projectMemories: Map<string, MemoryEntry[]>
  contactMemories: Map<string, MemoryEntry[]>
}

export interface FileContext {
  documents: Document[]
  documentsByType: Map<FileType, Document[]>
  documentsBySite: Map<string, Document[]>
  documentsByProject: Map<string, Document[]>
}

export interface AIContextLayer {
  memories: MemoryContext
  files: FileContext
  referencedAt: string
}

/**
 * AI should use this when generating responses:
 * - Check relevant memory entries based on context
 * - Reference file summaries and extracted text
 * - Link to original sources (memory IDs, file IDs)
 * - Acknowledge memory/file usage in responses
 */
export interface SourcedResponse {
  response: string
  sources: {
    memoryIds: string[]
    fileIds: string[]
  }
  timestamp: string
}
