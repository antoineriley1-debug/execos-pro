/**
 * Bulk Investigation Upload API
 * POST /api/investigations/bulk/upload
 * Receives FormData with files + jobName
 * Parses files and stores them in Supabase
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseAnonKey)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

const STORAGE_BUCKET = 'agent13-investigations'
const ALLOWED_TYPES = {
  'application/pdf': 'pdf',
  'application/msword': 'docx',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
  'message/rfc822': 'eml',
  'application/vnd.ms-outlook': 'msg',
}

type AllowedFileType = keyof typeof ALLOWED_TYPES

interface UploadResponse {
  jobId: string
  filesUploaded: number
  ready_for_analysis: boolean
  errors?: string[]
}

async function extractTextFromFile(
  file: File,
  fileType: string
): Promise<{ text: string; metadata: Record<string, any> }> {
  const buffer = await file.arrayBuffer()

  switch (fileType) {
    case 'pdf': {
      // PDF parsing using Buffer operations
      const text = await extractPdfText(Buffer.from(buffer))
      return { text, metadata: { pages: estimatePages(text) } }
    }
    case 'docx': {
      // DOCX is ZIP format, extract text from document.xml
      const text = await extractDocxText(Buffer.from(buffer))
      return { text, metadata: { format: 'docx' } }
    }
    case 'txt': {
      const text = new TextDecoder().decode(buffer)
      return { text, metadata: { format: 'text' } }
    }
    case 'eml': {
      const text = new TextDecoder().decode(buffer)
      const metadata = extractEmailMetadata(text)
      return { text, metadata }
    }
    case 'msg': {
      // MSG files are OLE compound documents, extract basic text
      const text = new TextDecoder().decode(buffer)
      return { text, metadata: { format: 'msg' } }
    }
    default:
      return { text: '', metadata: {} }
  }
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  // Simple PDF text extraction using regex patterns
  // In production, use pdf-parse library
  const text = buffer.toString('binary')
  const matches = text.match(/BT[\s\S]*?ET/g) || []
  return matches.join(' ').substring(0, 50000) // Limit to 50k chars
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  // DOCX files are ZIP archives containing XML
  // In production, use mammoth library
  try {
    const xmlStart = buffer.toString().indexOf('<?xml')
    if (xmlStart === -1) return ''

    const xmlContent = buffer.toString().substring(xmlStart, xmlStart + 100000)
    const textMatches = xmlContent.match(/<w:t>([^<]*)<\/w:t>/g) || []
    return textMatches
      .map((match) => match.replace(/<\/?w:t>/g, ''))
      .join(' ')
      .substring(0, 50000)
  } catch {
    return ''
  }
}

function extractEmailMetadata(text: string): Record<string, any> {
  const metadata: Record<string, any> = {}

  const fromMatch = text.match(/From:\s*(.+?)(?:\n|$)/i)
  if (fromMatch) metadata.from = fromMatch[1].trim()

  const toMatch = text.match(/To:\s*(.+?)(?:\n|$)/i)
  if (toMatch) metadata.to = toMatch[1].trim()

  const subjectMatch = text.match(/Subject:\s*(.+?)(?:\n|$)/i)
  if (subjectMatch) metadata.subject = subjectMatch[1].trim()

  const dateMatch = text.match(/Date:\s*(.+?)(?:\n|$)/i)
  if (dateMatch) metadata.date = dateMatch[1].trim()

  return metadata
}

function estimatePages(text: string): number {
  return Math.ceil(text.length / 3000)
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: user, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.user.id

    // Parse form data
    const formData = await request.formData()
    const jobName = formData.get('jobName') as string
    const files = formData.getAll('files') as File[]

    // Validate input
    if (!jobName || jobName.trim().length === 0) {
      return NextResponse.json(
        { error: 'jobName is required' },
        { status: 400 }
      )
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    if (files.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 files per upload' },
        { status: 400 }
      )
    }

    // Create bulk investigation job
    const { data: job, error: jobError } = await supabaseAdmin
      .from('bulk_investigations')
      .insert({
        user_id: userId,
        job_name: jobName.trim(),
        status: 'pending',
        total_files: files.length,
      })
      .select()
      .single()

    if (jobError || !job) {
      console.error('Job creation error:', jobError)
      return NextResponse.json(
        { error: 'Failed to create investigation job' },
        { status: 500 }
      )
    }

    const jobId = job.id
    const errors: string[] = []
    let filesUploaded = 0

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      try {
        // Validate file type
        const mimeType = file.type as AllowedFileType
        if (!ALLOWED_TYPES[mimeType]) {
          errors.push(`${file.name}: Unsupported file type`)
          continue
        }

        // File size validation (max 50MB per file)
        if (file.size > 50 * 1024 * 1024) {
          errors.push(`${file.name}: File too large (max 50MB)`)
          continue
        }

        const fileType = ALLOWED_TYPES[mimeType]

        // Extract text and metadata
        const { text: extractedText, metadata } = await extractTextFromFile(
          file,
          fileType
        )

        if (!extractedText || extractedText.length === 0) {
          errors.push(`${file.name}: Could not extract text from file`)
          continue
        }

        // Generate file hash for duplicate detection
        const buffer = await file.arrayBuffer()
        const hash = crypto
          .createHash('sha256')
          .update(Buffer.from(buffer))
          .digest('hex')

        // Check for duplicates in this job
        const { data: existingFile } = await supabaseAdmin
          .from('investigation_files')
          .select('id')
          .eq('bulk_investigation_id', jobId)
          .eq('user_id', userId)
          .like('storage_path', `%${hash}%`)
          .maybeSingle()

        if (existingFile) {
          errors.push(`${file.name}: Duplicate file detected`)
          continue
        }

        // Upload file to Supabase storage
        const storagePath = `${userId}/${jobId}/${hash}-${file.name}`
        const { error: uploadError } = await supabaseAdmin.storage
          .from(STORAGE_BUCKET)
          .upload(storagePath, Buffer.from(buffer), {
            contentType: file.type,
            upsert: false,
          })

        if (uploadError) {
          console.error(`Upload error for ${file.name}:`, uploadError)
          errors.push(`${file.name}: Upload failed`)
          continue
        }

        // Create investigation_files record
        const { error: fileRecordError } = await supabaseAdmin
          .from('investigation_files')
          .insert({
            user_id: userId,
            bulk_investigation_id: jobId,
            original_filename: file.name,
            file_size: file.size,
            file_type: fileType,
            storage_path: storagePath,
            extracted_text: extractedText,
            parsed_metadata: metadata,
            status: 'pending',
          })

        if (fileRecordError) {
          console.error(`File record error for ${file.name}:`, fileRecordError)
          errors.push(`${file.name}: Database record creation failed`)
          continue
        }

        filesUploaded++
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error)
        errors.push(`${file.name}: Processing error`)
      }
    }

    // Update job with processed file count
    if (filesUploaded > 0) {
      await supabaseAdmin
        .from('bulk_investigations')
        .update({ status: 'processing' })
        .eq('id', jobId)
    } else {
      await supabaseAdmin
        .from('bulk_investigations')
        .update({
          status: 'failed',
          error_message: 'No files were successfully uploaded',
        })
        .eq('id', jobId)
    }

    const response: UploadResponse = {
      jobId,
      filesUploaded,
      ready_for_analysis: filesUploaded > 0,
    }

    if (errors.length > 0) {
      response.errors = errors
    }

    return NextResponse.json(response, {
      status: filesUploaded > 0 ? 200 : 400,
    })
  } catch (error) {
    console.error('Upload endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
