/**
 * Unified Search API
 * GET /api/search/unified - Search across memory + files
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: user, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const sourceType = searchParams.get('sourceType') // memory, file, or both
    const tags = searchParams.get('tags')?.split(',')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!q || q.length < 2) {
      return NextResponse.json({ error: 'Query too short' }, { status: 400 })
    }

    const searchLower = q.toLowerCase()
    const results: any[] = []

    // Search memory entries
    if (!sourceType || sourceType === 'memory') {
      const { data: memories, error: memoryError } = await supabase
        .from('memory_entries')
        .select('*')
        .eq('user_id', user.user.id)

      if (!memoryError && memories) {
        const filtered = memories.filter((m: any) => {
          const matchesSearch =
            m.title.toLowerCase().includes(searchLower) ||
            m.content.toLowerCase().includes(searchLower)

          const matchesTags =
            !tags ||
            tags.length === 0 ||
            tags.some((tag: string) => m.tags.includes(tag))

          return matchesSearch && matchesTags
        })

        results.push(
          ...filtered.map((m: any) => ({
            id: m.id,
            type: 'memory',
            title: m.title,
            preview: m.content.substring(0, 150),
            memoryType: m.memory_type,
            tags: m.tags,
            createdAt: m.created_at,
            isPinned: m.is_pinned,
          }))
        )
      }
    }

    // Search documents
    if (!sourceType || sourceType === 'file') {
      const { data: files, error: fileError } = await supabase
        .from('documents_extended')
        .select('*')
        .eq('user_id', user.user.id)

      if (!fileError && files) {
        const filtered = files.filter((f: any) => {
          const matchesSearch =
            f.filename.toLowerCase().includes(searchLower) ||
            f.ai_summary?.toLowerCase().includes(searchLower) ||
            f.extracted_text?.toLowerCase().includes(searchLower)

          const matchesTags =
            !tags ||
            tags.length === 0 ||
            tags.some((tag: string) => f.ai_tags.includes(tag))

          return matchesSearch && matchesTags
        })

        results.push(
          ...filtered.map((f: any) => ({
            id: f.id,
            type: 'file',
            title: f.filename,
            preview: f.ai_summary || f.extracted_text?.substring(0, 150) || '',
            fileType: f.file_type,
            tags: f.ai_tags,
            createdAt: f.uploaded_at,
            fileSize: f.file_size,
            isStarred: f.is_starred,
          }))
        )
      }
    }

    // Sort by relevance and date
    results.sort((a: any, b: any) => {
      // Pinned items first
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1

      // Then by creation date
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    })

    return NextResponse.json({
      results: results.slice(0, limit),
      total: results.length,
      query: q,
    })
  } catch (error: any) {
    console.error('Unified search error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
