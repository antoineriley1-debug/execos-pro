/**
 * File Detail API Routes
 * GET /api/files/[id] - Get file details
 * PUT /api/files/[id] - Update file metadata
 * DELETE /api/files/[id] - Delete file
 * POST /api/files/[id]/analyze - Trigger AI analysis
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseAnonKey)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { data, error } = await supabase
      .from('documents_extended')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.user.id)
      .single()

    if (error) {
      console.error('File fetch error:', error)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Files API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { filename, aiTags, isStarred, linkedProjectId, linkedSiteId } = body

    const { data, error } = await supabase
      .from('documents_extended')
      .update({
        filename: filename || undefined,
        ai_tags: aiTags || undefined,
        is_starred: isStarred !== undefined ? isStarred : undefined,
        linked_project_id: linkedProjectId || undefined,
        linked_site_id: linkedSiteId || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('user_id', user.user.id)
      .select()

    if (error) {
      console.error('File update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data?.[0])
  } catch (error: any) {
    console.error('Files API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get file to find storage path
    const { data: file, error: fetchError } = await supabase
      .from('documents_extended')
      .select('file_url')
      .eq('id', params.id)
      .eq('user_id', user.user.id)
      .single()

    if (fetchError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Delete from storage
    const storagePath = file.file_url.split('/documents/')[1]
    if (storagePath) {
      await supabaseAdmin.storage.from('documents').remove([storagePath])
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('documents_extended')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.user.id)

    if (deleteError) {
      console.error('File delete error:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Files API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
