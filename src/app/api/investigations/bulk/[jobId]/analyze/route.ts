/**
 * Bulk Investigation Analyze API
 * POST /api/investigations/bulk/[jobId]/analyze
 * Starts batch analysis for all files in a job using Claude AI
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const claudeApiKey = process.env.CLAUDE_API_KEY || ''

const supabase = createClient(supabaseUrl, supabaseAnonKey)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

interface AnalyzeRequest {
  maxConcurrent?: number
}

interface AnalyzeResponse {
  jobId: string
  status: string
  filesProcessed: number
  totalFiles: number
  errors?: string[]
}

interface SummaryData {
  key_findings: string
  risk_score: number
  risk_level: 'low' | 'medium' | 'high'
  entities_found: Record<string, any>
  sentiment: 'negative' | 'neutral' | 'positive'
  tokens_used: number
}

async function analyzeFileWithClaude(
  fileText: string,
  filename: string
): Promise<SummaryData | null> {
  try {
    if (!claudeApiKey) {
      throw new Error('Claude API key not configured')
    }

    // Truncate text if too long (Claude's context window)
    const maxChars = 50000
    const truncatedText =
      fileText.length > maxChars ? fileText.substring(0, maxChars) : fileText

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `Analyze the following document and provide a JSON response with this exact structure:
{
  "key_findings": "2-3 sentence summary of main findings",
  "risk_score": 1-100,
  "risk_level": "low|medium|high",
  "entities_found": {
    "people": ["name1", "name2"],
    "organizations": ["org1"],
    "locations": ["location1"],
    "other": []
  },
  "sentiment": "negative|neutral|positive"
}

Document filename: ${filename}

Document content:
${truncatedText}

Respond ONLY with valid JSON, no markdown or extra text.`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Claude API error:', error)
      return null
    }

    const data = await response.json()
    const analysisText = data.content[0].text

    // Parse JSON response
    const analysis = JSON.parse(analysisText)

    // Validate risk_score
    const riskScore = Math.max(1, Math.min(100, parseInt(analysis.risk_score)))

    return {
      key_findings: analysis.key_findings || 'No findings',
      risk_score: riskScore,
      risk_level: getRiskLevel(riskScore),
      entities_found: analysis.entities_found || {},
      sentiment: analysis.sentiment || 'neutral',
      tokens_used: data.usage?.input_tokens || 0,
    }
  } catch (error) {
    console.error('Claude analysis error:', error)
    return null
  }
}

function getRiskLevel(
  score: number
): 'low' | 'medium' | 'high' {
  if (score <= 33) return 'low'
  if (score <= 66) return 'medium'
  return 'high'
}

async function processFilesInParallel(
  files: any[],
  maxConcurrent: number = 5
): Promise<Array<{ fileId: string; summary: SummaryData | null; error?: string }>> {
  const results: Array<{ fileId: string; summary: SummaryData | null; error?: string }> = []

  for (let i = 0; i < files.length; i += maxConcurrent) {
    const batch = files.slice(i, i + maxConcurrent)

    const batchResults = await Promise.all(
      batch.map(async (file) => {
        try {
          const summary = await analyzeFileWithClaude(
            file.extracted_text,
            file.original_filename
          )

          return {
            fileId: file.id,
            summary,
            error: summary ? undefined : 'Analysis failed',
          }
        } catch (error) {
          return {
            fileId: file.id,
            summary: null,
            error: String(error),
          }
        }
      })
    )

    results.push(...batchResults)
  }

  return results
}

export async function POST(
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

    // Parse request body for optional parameters
    let maxConcurrent = 5
    try {
      const body = (await request.json()) as AnalyzeRequest
      if (body.maxConcurrent && body.maxConcurrent > 0 && body.maxConcurrent <= 20) {
        maxConcurrent = body.maxConcurrent
      }
    } catch {
      // Use default maxConcurrent
    }

    // Verify job ownership
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

    // Check job status
    if (job.status === 'analyzing' || job.status === 'complete') {
      return NextResponse.json(
        { error: `Job is already ${job.status}` },
        { status: 400 }
      )
    }

    // Fetch all pending files for this job
    const { data: files, error: filesError } = await supabaseAdmin
      .from('investigation_files')
      .select('*')
      .eq('bulk_investigation_id', jobId)
      .eq('user_id', userId)
      .eq('status', 'pending')

    if (filesError || !files || files.length === 0) {
      return NextResponse.json(
        { error: 'No pending files found for analysis' },
        { status: 400 }
      )
    }

    // Update job status to analyzing
    await supabaseAdmin
      .from('bulk_investigations')
      .update({ status: 'analyzing', started_at: new Date().toISOString() })
      .eq('id', jobId)

    // Process files in parallel
    const results = await processFilesInParallel(files, maxConcurrent)

    const errors: string[] = []
    let filesProcessed = 0

    // Store summaries and update file status
    for (const result of results) {
      try {
        if (result.summary) {
          // Create investigation summary
          const { error: summaryError } = await supabaseAdmin
            .from('investigation_summaries')
            .insert({
              user_id: userId,
              investigation_file_id: result.fileId,
              key_findings: result.summary.key_findings,
              risk_score: result.summary.risk_score,
              risk_level: result.summary.risk_level,
              entities_found: result.summary.entities_found,
              sentiment: result.summary.sentiment,
              tokens_used: result.summary.tokens_used,
            })

          if (summaryError) {
            console.error('Summary creation error:', summaryError)
            errors.push(`File ${result.fileId}: Failed to store summary`)
            continue
          }

          // Update file status to analyzed
          await supabaseAdmin
            .from('investigation_files')
            .update({
              status: 'analyzed',
              analyzed_at: new Date().toISOString(),
            })
            .eq('id', result.fileId)

          filesProcessed++
        } else {
          // Mark as failed
          await supabaseAdmin
            .from('investigation_files')
            .update({
              status: 'failed',
              error: result.error || 'Analysis failed',
            })
            .eq('id', result.fileId)

          errors.push(
            `File ${result.fileId}: ${result.error || 'Analysis failed'}`
          )
        }
      } catch (error) {
        console.error('Summary storage error:', error)
        errors.push(`File ${result.fileId}: Storage error`)
      }
    }

    // Update job final status
    const finalStatus = filesProcessed === files.length ? 'complete' : 'complete'
    await supabaseAdmin
      .from('bulk_investigations')
      .update({
        status: finalStatus,
        processed_files: filesProcessed,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    const response: AnalyzeResponse = {
      jobId,
      status: finalStatus,
      filesProcessed,
      totalFiles: files.length,
    }

    if (errors.length > 0) {
      response.errors = errors
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Analyze endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
