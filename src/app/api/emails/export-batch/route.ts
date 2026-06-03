// API Route: POST /api/emails/export-batch
// Export multiple emails as batch with optional zip file

import { createClient } from '@supabase/supabase-js'
import JSZip from 'jszip'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface BatchExportRequest {
  emailIds: string[]
  format: 'pdf' | 'docx' | 'txt' | 'json' | 'csv' | 'md' | 'html'
  includeAttachments?: boolean
  includeFullAnalysis?: boolean
  includeResponseTemplate?: boolean
  separateFiles?: boolean
  jobName?: string
}

/**
 * Handler for batch exports
 * Can create individual files or combine into zip
 */
export async function POST(request: Request) {
  try {
    const {
      emailIds,
      format,
      includeAttachments,
      includeFullAnalysis,
      includeResponseTemplate,
      separateFiles = false,
      jobName,
    }: BatchExportRequest = await request.json()

    if (!emailIds || emailIds.length === 0 || !format) {
      return Response.json(
        { error: 'Missing emailIds array or format' },
        { status: 400 }
      )
    }

    // Get current user (would be from auth context in real app)
    const userId = request.headers.get('x-user-id') // Example - would come from auth

    // Create batch job record
    const { data: batchJob, error: jobError } = await supabase
      .from('batch_export_jobs')
      .insert({
        user_id: userId,
        job_name: jobName || `Batch Export ${new Date().toLocaleString()}`,
        email_ids: emailIds,
        export_format: format,
        include_attachments: includeAttachments || false,
        include_full_analysis: includeFullAnalysis !== false,
        include_response_template: includeResponseTemplate !== false,
        separate_files: separateFiles,
        total_emails: emailIds.length,
        status: 'processing',
      })
      .select()
      .single()

    if (jobError) {
      throw jobError
    }

    try {
      // Fetch all emails and their analyses
      const { data: emails, error: emailError } = await supabase
        .from('emails')
        .select('*, email_inferences(*)')
        .in('id', emailIds)

      if (emailError) {
        throw emailError
      }

      if (!emails || emails.length === 0) {
        throw new Error('No emails found')
      }

      // Generate exports for each email
      const zip = new JSZip()
      const csvRows: string[] = [
        'From,Subject,Date,Summary,Risk,Actions,Deadline,Project,Site',
      ]
      let combinedContent = ''

      let processedCount = 0

      for (const email of emails) {
        const analysis = email.email_inferences?.[0]

        // Generate content for this email
        let emailContent = ''

        if (format === 'txt') {
          emailContent = generateTextExport(email, analysis)
        } else if (format === 'csv') {
          csvRows.push(generateCsvRow(email, analysis))
        } else if (format === 'json') {
          emailContent = JSON.stringify(
            {
              email,
              analysis,
            },
            null,
            2
          )
        } else if (format === 'md') {
          emailContent = generateMarkdownExport(email, analysis)
        } else if (format === 'html') {
          emailContent = generateHtmlExport(email, analysis)
        }

        if (separateFiles && emailContent) {
          const fileName = `${email.subject || 'email'}-${email.id.slice(0, 8)}.${format === 'csv' ? 'csv' : format}`
          zip.file(fileName, emailContent)
        } else if (!separateFiles) {
          combinedContent += emailContent + '\n\n---\n\n'
        }

        processedCount++

        // Update progress
        const progress = Math.round((processedCount / emails.length) * 100)
        await supabase
          .from('batch_export_jobs')
          .update({ progress_percent: progress })
          .eq('id', batchJob.id)
      }

      // Handle final content
      let outputFile: Buffer | string | null = null
      let outputFileName: string = ''

      if (format === 'csv') {
        outputFile = csvRows.join('\n')
        outputFileName = `batch-export-${batchJob.id.slice(0, 8)}.csv`
        if (separateFiles) {
          zip.file(outputFileName, outputFile as string)
        }
      } else if (!separateFiles && combinedContent) {
        outputFile = combinedContent
        outputFileName = `batch-export-${batchJob.id.slice(0, 8)}.${format}`
      } else if (separateFiles) {
        // Create zip
        const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' })
        outputFile = Buffer.from(zipBuffer)
        outputFileName = `batch-export-${batchJob.id.slice(0, 8)}.zip`
      }

      // Upload to storage
      if (outputFile) {
        const { error: uploadError } = await supabase.storage
          .from('batch-exports')
          .upload(`${userId}/${outputFileName}`, outputFile, {
            contentType: format === 'csv' ? 'text/csv' : 'application/octet-stream',
          })

        if (uploadError) {
          throw uploadError
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('batch-exports')
          .getPublicUrl(`${userId}/${outputFileName}`)

        // Update batch job with final status
        const { error: updateError } = await supabase
          .from('batch_export_jobs')
          .update({
            status: 'completed',
            progress_percent: 100,
            output_file_url: urlData.publicUrl,
            output_file_size:
              typeof outputFile === 'string'
                ? outputFile.length
                : outputFile.length,
            completed_at: new Date().toISOString(),
          })
          .eq('id', batchJob.id)

        if (updateError) {
          console.error('Update error:', updateError)
        }

        return Response.json({
          success: true,
          jobId: batchJob.id,
          fileUrl: urlData.publicUrl,
          fileName: outputFileName,
          emailCount: emails.length,
          status: 'completed',
        })
      }
    } catch (exportError) {
      // Update batch job with error status
      await supabase
        .from('batch_export_jobs')
        .update({
          status: 'failed',
          error_message:
            exportError instanceof Error ? exportError.message : 'Unknown error',
        })
        .eq('id', batchJob.id)

      throw exportError
    }
  } catch (error) {
    console.error('Batch export error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Batch export failed' },
      { status: 500 }
    )
  }
}

/**
 * Generate text export for single email
 */
function generateTextExport(email: any, analysis: any): string {
  let text = `EMAIL INVESTIGATION
Export Date: ${new Date().toLocaleString()}

FROM: ${email.sender_email || 'N/A'}
SUBJECT: ${email.subject || 'N/A'}
DATE: ${new Date(email.received_at).toLocaleString()}

BODY:
${email.body_text || 'N/A'}

`

  if (analysis) {
    text += `ANALYSIS:
Sender Intent: ${analysis.sender_intent || 'N/A'}
Risk Level: ${analysis.risk_level || 'Unknown'}
Tone: ${analysis.tone || 'N/A'}
`

    if (analysis.action_items?.length > 0) {
      text += `Action Items:\n`
      analysis.action_items.forEach((item: string) => {
        text += `  - ${item}\n`
      })
    }

    if (analysis.deadline_pressure) {
      text += `Deadline: ${analysis.deadline_pressure}\n`
    }
  }

  return text
}

/**
 * Generate CSV row for single email
 */
function generateCsvRow(email: any, analysis: any): string {
  const fields = [
    email.sender_email || '',
    email.subject || '',
    new Date(email.received_at).toLocaleString(),
    analysis?.sender_intent || '',
    analysis?.risk_level || '',
    analysis?.action_items?.join('; ') || '',
    analysis?.deadline_pressure || '',
    '', // Project
    '', // Site
  ]

  return fields.map((f) => `"${f}"`).join(',')
}

/**
 * Generate Markdown export for single email
 */
function generateMarkdownExport(email: any, analysis: any): string {
  let md = `# ${email.subject || 'Email Investigation'}\n\n`
  md += `**From:** ${email.sender_email || 'N/A'}\n`
  md += `**Date:** ${new Date(email.received_at).toLocaleString()}\n\n`

  md += `## Body\n\n${email.body_text || 'N/A'}\n\n`

  if (analysis) {
    md += `## Analysis\n\n`
    md += `**Intent:** ${analysis.sender_intent || 'N/A'}\n\n`
    md += `**Risk:** ${analysis.risk_level || 'Unknown'}\n\n`
    md += `**Tone:** ${analysis.tone || 'N/A'}\n\n`

    if (analysis.action_items?.length > 0) {
      md += `### Actions\n\n`
      analysis.action_items.forEach((item: string) => {
        md += `- ${item}\n`
      })
    }
  }

  return md
}

/**
 * Generate HTML export for single email
 */
function generateHtmlExport(email: any, analysis: any): string {
  return `<html>
<head><title>${email.subject || 'Email'}</title></head>
<body>
  <h1>${email.subject || 'Email Investigation'}</h1>
  <p><strong>From:</strong> ${email.sender_email || 'N/A'}</p>
  <p><strong>Date:</strong> ${new Date(email.received_at).toLocaleString()}</p>
  
  <h2>Body</h2>
  <p>${(email.body_text || 'N/A').replace(/\n/g, '<br>')}</p>
  
  ${
    analysis
      ? `
  <h2>Analysis</h2>
  <p><strong>Intent:</strong> ${analysis.sender_intent || 'N/A'}</p>
  <p><strong>Risk:</strong> ${analysis.risk_level || 'Unknown'}</p>
  <p><strong>Tone:</strong> ${analysis.tone || 'N/A'}</p>
  ${
    analysis.action_items?.length > 0
      ? `<h3>Actions</h3><ul>${analysis.action_items.map((i: string) => `<li>${i}</li>`).join('')}</ul>`
      : ''
  }
  `
      : ''
  }
</body>
</html>`
}

/**
 * GET /api/emails/export-batch?jobId=xxx
 * Check batch export job status
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return Response.json({ error: 'Missing jobId' }, { status: 400 })
    }

    const { data: job, error } = await supabase
      .from('batch_export_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (error || !job) {
      return Response.json({ error: 'Job not found' }, { status: 404 })
    }

    return Response.json({
      jobId: job.id,
      status: job.status,
      progress: job.progress_percent,
      emailCount: job.total_emails,
      fileUrl: job.output_file_url,
      fileName: job.file_name,
      completedAt: job.completed_at,
      errorMessage: job.error_message,
    })
  } catch (error) {
    console.error('Error checking batch status:', error)
    return Response.json(
      { error: 'Failed to check batch status' },
      { status: 500 }
    )
  }
}
