/**
 * Files API Routes
 * GET /api/files - List all files
 * DELETE /api/files/[id] - Delete file
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseAnonKey)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

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
    const fileType = searchParams.get('fileType')
    const linkedSiteId = searchParams.get('linkedSiteId')
    const linkedProjectId = searchParams.get('linkedProjectId')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('documents_extended')
      .select('*', { count: 'exact' })
      .eq('user_id', user.user.id)
      .order('uploaded_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (fileType) {
      query = query.eq('file_type', fileType)
    }

    if (linkedSiteId) {
      query = query.eq('linked_site_id', linkedSiteId)
    }

    if (linkedProjectId) {
      query = query.eq('linked_project_id', linkedProjectId)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Files fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let filtered = data || []

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter((item: any) =>
        item.filename.toLowerCase().includes(searchLower) ||
        item.ai_summary?.toLowerCase().includes(searchLower) ||
        item.extracted_text?.toLowerCase().includes(searchLower)
      )
    }

    return NextResponse.json({
      data: filtered,
      total: count || 0,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error('Files API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
