/**
 * Memory Management API Routes
 * GET /api/memory - List all memory entries
 * POST /api/memory - Create new memory entry
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
    const memoryType = searchParams.get('type') // global, site, project, contact
    const siteId = searchParams.get('siteId')
    const projectId = searchParams.get('projectId')
    const contactId = searchParams.get('contactId')
    const search = searchParams.get('search')
    const tags = searchParams.get('tags')?.split(',')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('memory_entries')
      .select('*', { count: 'exact' })
      .eq('user_id', user.user.id)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by memory type
    if (memoryType) {
      query = query.eq('memory_type', memoryType)
    }

    // Filter by site
    if (siteId && memoryType === 'site') {
      query = query.eq('site_id', siteId)
    }

    // Filter by project
    if (projectId && memoryType === 'project') {
      query = query.eq('project_id', projectId)
    }

    // Filter by contact
    if (contactId && memoryType === 'contact') {
      query = query.eq('contact_id', contactId)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Memory fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Client-side filtering for search and tags if needed
    let filtered = data || []

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(
        (item: any) =>
          item.title.toLowerCase().includes(searchLower) ||
          item.content.toLowerCase().includes(searchLower)
      )
    }

    if (tags && tags.length > 0) {
      filtered = filtered.filter((item: any) =>
        tags.some((tag: string) => item.tags.includes(tag))
      )
    }

    return NextResponse.json({
      data: filtered,
      total: count || 0,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error('Memory API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const {
      memoryType,
      title,
      content,
      tags,
      siteId,
      projectId,
      contactId,
    } = body

    if (!memoryType || !title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('memory_entries')
      .insert([
        {
          user_id: user.user.id,
          memory_type: memoryType,
          title,
          content,
          tags: tags || [],
          site_id: siteId || null,
          project_id: projectId || null,
          contact_id: contactId || null,
        },
      ])
      .select()

    if (error) {
      console.error('Memory insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data?.[0], { status: 201 })
  } catch (error: any) {
    console.error('Memory API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
