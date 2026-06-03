/**
 * File Upload API Route
 * POST /api/files/upload - Handle single and bulk file uploads
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseAnonKey)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const linkedProjectId = formData.get('linkedProjectId') as string | null
    const linkedSiteId = formData.get('linkedSiteId') as string | null
    const linkedContractId = formData.get('linkedContractId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // File validation
    const maxFileSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxFileSize) {
      return NextResponse.json(
        { error: 'File too large (max 100MB)' },
        { status: 400 }
      )
    }

    // Allowed file types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      )
    }

    // Create file hash for duplicate detection
    const buffer = await file.arrayBuffer()
    const hash = crypto
      .createHash('sha256')
      .update(Buffer.from(buffer))
      .digest('hex')

    // Check for duplicates
    const { data: existingFile } = await supabase
      .from('documents_extended')
      .select('id')
      .eq('user_id', user.user.id)
      .eq('file_hash', hash)
      .single()

    if (existingFile) {
      return NextResponse.json(
        { error: 'File already exists', existingFileId: existingFile.id },
        { status: 409 }
      )
    }

    // Determine file type
    const filename = file.name
    const ext = filename.split('.').pop()?.toLowerCase()
    let fileType = 'other'

    if (file.type === 'application/pdf') fileType = 'pdf'
    else if (
      file.type ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword'
    )
      fileType = ext === 'docx' ? 'docx' : 'doc'
    else if (
      file.type ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel'
    )
      fileType = ext === 'xlsx' ? 'xlsx' : 'xls'
    else if (file.type === 'text/csv') fileType = 'csv'
    else if (file.type === 'text/plain') fileType = 'txt'
    else if (file.type.startsWith('image/')) fileType = ext || 'image'

    // Upload to Supabase Storage
    const storagePath = `${user.user.id}/${Date.now()}-${filename}`
    const { error: uploadError } = await supabaseAdmin.storage
      .from('documents')
      .upload(storagePath, file, { upsert: false })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: 'Upload failed' },
        { status: 500 }
      )
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from('documents').getPublicUrl(storagePath)

    // Create document record
    const { data: document, error: docError } = await supabase
      .from('documents_extended')
      .insert([
        {
          user_id: user.user.id,
          filename,
          file_type: fileType,
          file_url: publicUrl,
          file_size: file.size,
          file_hash: hash,
          linked_project_id: linkedProjectId || null,
          linked_site_id: linkedSiteId || null,
          linked_contract_id: linkedContractId || null,
          ai_tags: [],
        },
      ])
      .select()

    if (docError) {
      console.error('Document create error:', docError)
      return NextResponse.json(
        { error: docError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(document?.[0], { status: 201 })
  } catch (error: any) {
    console.error('File upload API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
