/**
 * Bulk Investigation Export API
 * POST /api/investigations/bulk/[jobId]/export
 * Generates exports in PDF, JSON, or CSV format
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseAnonKey)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

type ExportFormat = 'pdf' | 'json' | 'csv'

interface ExportRequest {
  format: ExportFormat
}

interface ExportResponse {
  success: boolean
  format: string
  filename: string
  data?: string | Record<string, any>
  downloadUrl?: string
}

function generateCSVContent(
  job: any,
  files: any[],
  summaries: any[],
  aggregate: any
): string {
  const lines: string[] = []

  // Header info
  lines.push(`"Investigation Report Export"`)
  lines.push(`"Job Name","${job.job_name}"`)
  lines.push(`"Job ID","${job.id}"`)
  lines.push(`"Status","${job.status}"`)
  lines.push(`"Total Files","${job.total_files}"`)
  lines.push(`"Processed Files","${job.processed_files}"`)
  lines.push(`"Created At","${job.created_at}"`)
  lines.push('')

  // Aggregate metrics
  if (aggregate) {
    lines.push(`"AGGREGATE METRICS"`)
    lines.push(`"Average Risk Score","${aggregate.average_risk_score}"`)
    lines.push('')
  }

  // File records
  lines.push(`"File Details"`)
  lines.push(
    `"Filename","File Type","File Size","Status","Risk Score","Risk Level","Sentiment"`
  )

  const summaryMap = new Map(
    summaries.map((s) => [s.investigation_file_id, s])
  )

  for (const file of files) {
    const summary = summaryMap.get(file.id)
    const riskScore = summary?.risk_score || 'N/A'
    const riskLevel = summary?.risk_level || 'N/A'
    const sentiment = summary?.sentiment || 'N/A'

    lines.push(
      `"${escapeCSV(file.original_filename)}","${file.file_type}","${file.file_size}","${file.status}","${riskScore}","${riskLevel}","${sentiment}"`
    )
  }

  return lines.join('\n')
}

function generateJSONContent(
  job: any,
  files: any[],
  summaries: any[],
  aggregate: any
): Record<string, any> {
  const summaryMap = new Map(
    summaries.map((s) => [s.investigation_file_id, s])
  )

  const fileSummaries = files.map((file) => {
    const summary = summaryMap.get(file.id)
    return {
      filename: file.original_filename,
      fileType: file.file_type,
      fileSize: file.file_size,
      status: file.status,
      uploadedAt: file.uploaded_at,
      analyzedAt: file.analyzed_at,
      summary: summary
        ? {
            key_findings: summary.key_findings,
            risk_score: summary.risk_score,
            risk_level: summary.risk_level,
            entities_found: summary.entities_found,
            sentiment: summary.sentiment,
            tokens_used: summary.tokens_used,
          }
        : null,
    }
  })

  return {
    jobId: job.id,
    jobName: job.job_name,
    status: job.status,
    metadata: {
      totalFiles: job.total_files,
      processedFiles: job.processed_files,
      createdAt: job.created_at,
      startedAt: job.started_at,
      completedAt: job.completed_at,
    },
    files: fileSummaries,
    aggregate: aggregate ? {
      summary: aggregate.aggregate_summary,
      common_themes: aggregate.common_themes,
      top_risks: aggregate.top_risks,
      all_entities: aggregate.all_entities,
      average_risk_score: aggregate.average_risk_score,
      sentiment_distribution: aggregate.sentiment_distribution,
    } : null,
  }
}

function generatePDFContent(
  job: any,
  files: any[],
  summaries: any[],
  aggregate: any
): string {
  // Simple HTML-like format that could be converted to PDF
  // In production, use a library like jsPDF or pdfkit

  const lines: string[] = []

  lines.push(
    `<!DOCTYPE html>
<html>
<head>
<style>
body { font-family: Arial, sans-serif; margin: 20px; }
.header { background: #f0f0f0; padding: 10px; border-radius: 5px; margin-bottom: 20px; }
.section { margin-bottom: 20px; page-break-inside: avoid; }
.risk-high { color: #d32f2f; }
.risk-medium { color: #f57c00; }
.risk-low { color: #388e3c; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
th { background-color: #f0f0f0; }
</style>
</head>
<body>`
  )

  lines.push(
    `<div class="header">
<h1>Investigation Report: ${escapeHtml(job.job_name)}</h1>
<p><strong>Job ID:</strong> ${job.id}</p>
<p><strong>Status:</strong> ${job.status}</p>
<p><strong>Created:</strong> ${new Date(job.created_at).toLocaleString()}</p>
</div>`
  )

  // Aggregate section
  if (aggregate) {
    lines.push(
      `<div class="section">
<h2>Aggregate Analysis</h2>
<p>${escapeHtml(aggregate.aggregate_summary)}</p>

<h3>Common Themes</h3>
<ul>
${aggregate.common_themes.map((t: string) => `<li>${escapeHtml(t)}</li>`).join('\n')}
</ul>

<h3>Top Risks</h3>
<ul>
${aggregate.top_risks.map((r: string) => `<li>${escapeHtml(r)}</li>`).join('\n')}
</ul>

<p><strong>Average Risk Score:</strong> ${aggregate.average_risk_score}</p>
</div>`
    )
  }

  // Individual files section
  lines.push(
    `<div class="section">
<h2>Individual File Analysis</h2>
<table>
<tr>
<th>Filename</th>
<th>Risk Level</th>
<th>Risk Score</th>
<th>Sentiment</th>
<th>Status</th>
</tr>`
  )

  const summaryMap = new Map(
    summaries.map((s) => [s.investigation_file_id, s])
  )

  for (const file of files) {
    const summary = summaryMap.get(file.id)
    const riskLevel = summary?.risk_level || 'N/A'
    const riskScore = summary?.risk_score || 'N/A'
    const riskClass = `risk-${riskLevel}`.toLowerCase()

    lines.push(
      `<tr>
<td>${escapeHtml(file.original_filename)}</td>
<td class="${riskClass}">${riskLevel}</td>
<td>${riskScore}</td>
<td>${summary?.sentiment || 'N/A'}</td>
<td>${file.status}</td>
</tr>`
    )

    if (summary) {
      lines.push(
        `<tr><td colspan="5">
<strong>Findings:</strong> ${escapeHtml(summary.key_findings)}
</td></tr>`
      )
    }
  }

  lines.push(`</table></div>`)
  lines.push(`</body></html>`)

  return lines.join('\n')
}

function escapeCSV(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}""`
  }
  return value
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
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

    // Parse request body
    const body = (await request.json()) as ExportRequest
    const format = body.format?.toLowerCase() as ExportFormat

    if (!format || !['pdf', 'json', 'csv'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid export format. Must be: pdf, json, or csv' },
        { status: 400 }
      )
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

    // Fetch files
    const { data: files, error: filesError } = await supabaseAdmin
      .from('investigation_files')
      .select('*')
      .eq('bulk_investigation_id', jobId)
      .eq('user_id', userId)

    if (filesError || !files) {
      return NextResponse.json(
        { error: 'Failed to fetch files' },
        { status: 500 }
      )
    }

    // Fetch summaries
    const fileIds = files.map((f) => f.id)
    let summaries = []
    if (fileIds.length > 0) {
      const { data: summaryData } = await supabaseAdmin
        .from('investigation_summaries')
        .select('*')
        .in('investigation_file_id', fileIds)

      summaries = summaryData || []
    }

    // Fetch aggregate
    const { data: aggregateData } = await supabaseAdmin
      .from('investigation_aggregates')
      .select('*')
      .eq('bulk_investigation_id', jobId)
      .eq('user_id', userId)
      .maybeSingle()

    // Generate export based on format
    let data: any
    let contentType: string
    let filename: string

    switch (format) {
      case 'json': {
        data = generateJSONContent(job, files, summaries, aggregateData)
        contentType = 'application/json'
        filename = `investigation_${job.id}.json`
        break
      }
      case 'csv': {
        data = generateCSVContent(job, files, summaries, aggregateData)
        contentType = 'text/csv'
        filename = `investigation_${job.id}.csv`
        break
      }
      case 'pdf': {
        data = generatePDFContent(job, files, summaries, aggregateData)
        contentType = 'text/html'
        filename = `investigation_${job.id}.html`
        // Note: In production, convert HTML to PDF using jsPDF or similar
        break
      }
    }

    const response: ExportResponse = {
      success: true,
      format,
      filename,
      data,
    }

    // Return with appropriate headers
    if (format === 'json') {
      return NextResponse.json(response)
    } else {
      // Return as file download
      return new NextResponse(data, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }
  } catch (error) {
    console.error('Export endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
