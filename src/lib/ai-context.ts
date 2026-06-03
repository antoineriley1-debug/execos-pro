/**
 * AI Context Integration Layer
 * Allows AI to access and reference memory and files for contextual analysis
 */

import { createClient } from '@supabase/supabase-js'
import {
  MemoryEntry,
  Document,
  AIContextLayer,
  MemoryContext,
  FileContext,
} from '@/types/memory'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Get all relevant memory for a specific site
 * Used when AI analyzes site-specific emails/documents
 */
export async function getSiteMemoryContext(
  userId: string,
  siteId: string
): Promise<MemoryEntry[]> {
  const { data, error } = await supabase
    .from('memory_entries')
    .select('*')
    .eq('user_id', userId)
    .or(`and(memory_type.eq.global),and(memory_type.eq.site,site_id.eq.${siteId})`)
    .eq('is_archived', false)
    .order('is_pinned', { ascending: false })

  if (error) {
    console.error('Error fetching site memory:', error)
    return []
  }

  return data || []
}

/**
 * Get all relevant files for a specific site
 * Used when AI needs to reference uploaded documents
 */
export async function getSiteFileContext(
  userId: string,
  siteId: string
): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents_extended')
    .select('*')
    .eq('user_id', userId)
    .eq('linked_site_id', siteId)
    .order('uploaded_at', { ascending: false })

  if (error) {
    console.error('Error fetching site files:', error)
    return []
  }

  return data || []
}

/**
 * Get memory related to a specific contact/sender
 * Used when analyzing emails from specific people
 */
export async function getContactMemory(
  userId: string,
  contactId: string
): Promise<MemoryEntry[]> {
  const { data, error } = await supabase
    .from('memory_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('memory_type', 'contact')
    .eq('contact_id', contactId)
    .eq('is_archived', false)
    .order('is_pinned', { ascending: false })

  if (error) {
    console.error('Error fetching contact memory:', error)
    return []
  }

  return data || []
}

/**
 * Get memory related to a specific project
 * Used when analyzing project-related emails
 */
export async function getProjectMemory(
  userId: string,
  projectId: string
): Promise<MemoryEntry[]> {
  const { data, error } = await supabase
    .from('memory_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('memory_type', 'project')
    .eq('project_id', projectId)
    .eq('is_archived', false)
    .order('is_pinned', { ascending: false })

  if (error) {
    console.error('Error fetching project memory:', error)
    return []
  }

  return data || []
}

/**
 * Get global memory (applies to all work)
 * Used by AI for general context, procedures, preferences
 */
export async function getGlobalMemory(userId: string): Promise<MemoryEntry[]> {
  const { data, error } = await supabase
    .from('memory_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('memory_type', 'global')
    .eq('is_archived', false)
    .order('is_pinned', { ascending: false })

  if (error) {
    console.error('Error fetching global memory:', error)
    return []
  }

  return data || []
}

/**
 * Full memory context for an AI session
 * Loads all memory and files for comprehensive context
 */
export async function getFullAIContext(
  userId: string,
  siteId?: string,
  projectId?: string,
  contactId?: string
): Promise<AIContextLayer> {
  const now = new Date().toISOString()

  // Load all relevant memory
  const globalMemories = await getGlobalMemory(userId)

  let siteMemories: MemoryEntry[] = []
  let siteFiles: Document[] = []

  if (siteId) {
    const siteSpecificMemories = await supabase
      .from('memory_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('memory_type', 'site')
      .eq('site_id', siteId)
      .eq('is_archived', false)

    siteMemories = siteSpecificMemories.data || []
    siteFiles = await getSiteFileContext(userId, siteId)
  }

  let projectMemories: MemoryEntry[] = []
  if (projectId) {
    const projectSpecificMemories = await getProjectMemory(userId, projectId)
    projectMemories = projectSpecificMemories
  }

  let contactMemories: MemoryEntry[] = []
  if (contactId) {
    contactMemories = await getContactMemory(userId, contactId)
  }

  // Build memory context
  const memoryContext: MemoryContext = {
    globalMemories,
    siteMemories: new Map(
      siteId ? [[siteId, siteMemories]] : []
    ),
    projectMemories: new Map(
      projectId ? [[projectId, projectMemories]] : []
    ),
    contactMemories: new Map(
      contactId ? [[contactId, contactMemories]] : []
    ),
  }

  // Build file context
  const fileContext: FileContext = {
    documents: siteFiles,
    documentsByType: new Map(),
    documentsBySite: new Map(
      siteId ? [[siteId, siteFiles]] : []
    ),
    documentsByProject: new Map(),
  }

  // Index documents by type
  siteFiles.forEach((doc) => {
    const docs = fileContext.documentsByType.get(doc.file_type) || []
    docs.push(doc)
    fileContext.documentsByType.set(doc.file_type, docs)
  })

  return {
    memories: memoryContext,
    files: fileContext,
    referencedAt: now,
  }
}

/**
 * Track memory access for AI usage analytics
 * Called when AI references a memory entry
 */
export async function recordMemoryAccess(memoryId: string): Promise<void> {
  try {
    await supabase
      .from('memory_entries')
      .update({
        last_accessed_at: new Date().toISOString(),
        access_count: supabase.rpc('increment_access_count', { row_id: memoryId }),
      })
      .eq('id', memoryId)
  } catch (error) {
    console.error('Error recording memory access:', error)
  }
}

/**
 * Format memory entries for AI prompt injection
 * Creates a readable summary of relevant memory
 */
export function formatMemoryForAI(memories: MemoryEntry[]): string {
  if (memories.length === 0) {
    return 'No relevant memory entries.'
  }

  const formatted = memories
    .map((m) => {
      const pinnedIndicator = m.is_pinned ? '📌 ' : ''
      const typeEmoji = {
        global: '🌐',
        site: '🏢',
        project: '📋',
        contact: '👤',
      }[m.memory_type] || '📝'

      return `${pinnedIndicator}${typeEmoji} [${m.title}]
Content: ${m.content}
Tags: ${m.tags.join(', ') || 'none'}
Created: ${new Date(m.created_at).toLocaleDateString()}`
    })
    .join('\n\n---\n\n')

  return formatted
}

/**
 * Format file summaries for AI prompt injection
 * Creates a readable summary of relevant files
 */
export function formatFilesForAI(files: Document[]): string {
  if (files.length === 0) {
    return 'No relevant files.'
  }

  const formatted = files
    .map((f) => {
      const starredIndicator = f.is_starred ? '⭐ ' : ''
      const typeEmoji = {
        pdf: '📄',
        doc: '📝',
        docx: '📝',
        xlsx: '📊',
        csv: '📋',
        txt: '📃',
        image: '🖼️',
      }[f.file_type] || '📎'

      return `${starredIndicator}${typeEmoji} [${f.filename}]
Type: ${f.file_type.toUpperCase()}
Size: ${(f.file_size / 1024).toFixed(2)} KB
${f.ai_summary ? `Summary: ${f.ai_summary}` : ''}
${f.ai_tags.length > 0 ? `Tags: ${f.ai_tags.join(', ')}` : ''}
Uploaded: ${new Date(f.uploaded_at).toLocaleDateString()}`
    })
    .join('\n\n---\n\n')

  return formatted
}

/**
 * Create AI system prompt injection with memory + files context
 * Use this in Claude/API calls to give AI full context
 */
export function createAISystemPrompt(context: AIContextLayer): string {
  const memoryInstructions = `
## MEMORY SYSTEM
You have access to saved memory entries created by the user. Use these to:
- Understand preferences and operating procedures
- Reference previous decisions and commitments
- Provide contextually relevant responses
- Remember important historical information

When you reference memory, include it as context source:
"[Referenced Memory: <title>]"

${formatMemoryForAI([...context.memories.globalMemories, ...Array.from(context.memories.siteMemories.values()).flat()])}
`

  const fileInstructions = `
## DOCUMENT SYSTEM
You have access to uploaded files and their AI-extracted summaries. Use these to:
- Reference specific documents in your analysis
- Extract key information from documents
- Link recommendations to supporting documents
- Provide accurate, sourced information

When you reference files, include them as context source:
"[Referenced File: <filename>]"

${formatFilesForAI(context.files.documents)}
`

  return `You are EXECOS Pro's AI assistant. You help analyze emails, manage workflows, and provide intelligent recommendations.

${memoryInstructions}

${fileInstructions}

Always acknowledge when using memory or files in your responses. This helps the user understand your reasoning and builds trust.`
}

/**
 * Search memory + files for relevant context
 * Used before responding to email analysis or queries
 */
export async function searchContextForQuery(
  userId: string,
  query: string,
  limit: number = 10
): Promise<{
  memories: MemoryEntry[]
  files: Document[]
}> {
  const searchLower = query.toLowerCase()

  // Search memories
  const { data: memories } = await supabase
    .from('memory_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('is_archived', false)

  const relevantMemories = (memories || [])
    .filter(
      (m) =>
        m.title.toLowerCase().includes(searchLower) ||
        m.content.toLowerCase().includes(searchLower)
    )
    .sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0))
    .slice(0, limit)

  // Search files
  const { data: files } = await supabase
    .from('documents_extended')
    .select('*')
    .eq('user_id', userId)

  const relevantFiles = (files || [])
    .filter(
      (f) =>
        f.filename.toLowerCase().includes(searchLower) ||
        f.ai_summary?.toLowerCase().includes(searchLower) ||
        f.extracted_text?.toLowerCase().includes(searchLower)
    )
    .slice(0, limit)

  return {
    memories: relevantMemories,
    files: relevantFiles,
  }
}
