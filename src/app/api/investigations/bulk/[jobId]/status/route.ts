/**
 * Bulk Investigation Status API
 * GET /api/investigations/bulk/[jobId]/status
 * Returns job status and progress
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseAnonKey)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

interface StatusResponse {
  jobId: string
  jobName: string
  status: 'pending' | 'processing' | 'analyzing' | 'complete' | 'failed'
  totalFiles: number
  processedFiles: number
  percentComplete: number
  startedAt?: string
  completedAt?: string
  errorMessage?: string
  fileStatuses: Array<{
    fileId: string
    filename: string
    status: 'pending' | 'analyzed' | 'failed'
    error?: string
    analyzedAt?: string
  }>
}

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
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
    const jobId = params.jobId

    // Fetch job details
    const { data: job, error: jobError } = await supabaseAdmin
      .from('bulk_investigations')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', userId)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Investigation job not found' },
        { status: 404 }
      )
    }

    // Fetch file statuses
    const { data: files, error: filesError } = await supabaseAdmin
      .from('investigation_files')
      .select('id, original_filename, status, error, analyzed_at')
      .eq('bulk_investigation_id', jobId)
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: true })

    if (filesError) {
      console.error('Files fetch error:', filesError)
      return NextResponse.json(
        { error: 'Failed to fetch file statuses' },
        { status: 500 }
      )
    }

    const fileStatuses = (files || []).map((file) => ({
      fileId: file.id,
      filename: file.original_filename,
      status: file.status,
      error: file.error,
      analyzedAt: file.analyzed_at,
    }))

    const totalFiles = job.total_files || 0
    const processedFiles = job.processed_files || 0
    const percentComplete =
      totalFiles > 0 ? Math.round((processedFiles / totalFiles) * 100) : 0

    const response: StatusResponse = {
      jobId,
      jobName: job.job_name,
      status: job.status,
      totalFiles,
      processedFiles,
      percentComplete,
      fileStatuses,
    }

    if (job.started_at) {
      response.startedAt = job.started_at
    }

    if (job.completed_at) {
      response.completedAt = job.completed_at
    }

    if (job.error_message) {
      response.errorMessage = job.error_message
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Status endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
