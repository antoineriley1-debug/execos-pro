// API Route: POST /api/emails/[id]/export
// Export single email investigation in multiple formats

import { createClient } from '@supabase/supabase-js'
import jsPDF from 'jspdf'
import { Packer, Document, Paragraph, Table, TableRow, TableCell, HeadingLevel, AlignmentType } from 'docx'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ExportRequest {
  emailId: string
  format: 'pdf' | 'docx' | 'txt' | 'json' | 'csv' | 'md' | 'html'
  includeAttachments?: boolean
  includeFullAnalysis?: boolean
  includeResponseTemplate?: boolean
  exportName?: string
}

/**
 * Generate PDF export with professional formatting
 */
async function generatePdfExport(
  emailData: any,
  analysis: any,
  options: ExportRequest
): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - 2 * margin

  let yPosition = margin

  // Header with branding
  doc.setFillColor(25, 34, 71) // MedStar/Crothall blue
  doc.rect(0, 0, pageWidth, 25, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.text('EXECOS Pro', margin, 18)
  doc.setFontSize(10)
  doc.text('Email Investigation Export', pageWidth - margin, 18, { align: 'right' })

  yPosition = 35
  doc.setTextColor(0, 0, 0)

  // Email Header Section
  doc.setFontSize(12)
  doc.setFont("Helvetica", 'bold')
  doc.text('Email Header', margin, yPosition)
  yPosition += 8

  doc.setFontSize(9)
  doc.setFont("Helvetica", 'normal')
  const emailDetails = [
    [`From: ${emailData.sender_email}`],
    [`To: ${emailData.recipient_email || 'N/A'}`],
    [`Subject: ${emailData.subject}`],
    [`Date: ${new Date(emailData.received_at).toLocaleString()}`],
  ]

  emailDetails.forEach((line) => {
    doc.text(line[0], margin, yPosition, { maxWidth: contentWidth })
    yPosition += 6
  })

  yPosition += 4

  // Email Body
  doc.setFontSize(11)
  doc.setFont("Helvetica", 'bold')
  doc.text('Email Body', margin, yPosition)
  yPosition += 6

  doc.setFontSize(9)
  doc.setFont("Helvetica", 'normal')
  const bodyLines = doc.splitTextToSize(emailData.body_text || 'N/A', contentWidth)
  doc.text(bodyLines, margin, yPosition)
  yPosition += bodyLines.length * 4 + 4

  // AI Analysis Section
  if (options.includeFullAnalysis && analysis) {
    doc.setFontSize(11)
    doc.setFont("Helvetica", 'bold')
    doc.text('AI Analysis', margin, yPosition)
    yPosition += 6

    doc.setFontSize(9)
    doc.setFont("Helvetica", 'normal')

    // Intent
    doc.setFont("Helvetica", 'bold')
    doc.text('Sender Intent:', margin, yPosition)
    doc.setFont("Helvetica", 'normal')
    yPosition += 4
    const intentLines = doc.splitTextToSize(analysis.sender_intent || 'N/A', contentWidth - 10)
    doc.text(intentLines, margin + 5, yPosition)
    yPosition += intentLines.length * 4 + 3

    // Risk Level
    doc.setFont("Helvetica", 'bold')
    doc.text('Risk Level:', margin, yPosition)
    doc.setFont("Helvetica", 'normal')

    const riskColors: { [key: string]: [number, number, number] } = {
      green: [76, 175, 80],
      yellow: [255, 193, 7],
      red: [244, 67, 54],
    }
    const riskColor = riskColors[analysis.risk_level as keyof typeof riskColors] || [128, 128, 128]
    doc.setFillColor(riskColor[0], riskColor[1], riskColor[2])
    doc.rect(margin + 25, yPosition - 4, 8, 8, 'F')
    doc.text(analysis.risk_level.toUpperCase(), margin + 35, yPosition, { maxWidth: contentWidth - 35 })
    yPosition += 6

    // Tone
    doc.setFont("Helvetica", 'bold')
    doc.text('Tone:', margin, yPosition)
    doc.setFont("Helvetica", 'normal')
    doc.text(analysis.tone || 'N/A', margin + 15, yPosition)
    yPosition += 6

    // Action Items
    if (analysis.action_items && analysis.action_items.length > 0) {
      doc.setFont("Helvetica", 'bold')
      doc.text('Action Items:', margin, yPosition)
      yPosition += 4

      doc.setFont("Helvetica", 'normal')
      analysis.action_items.forEach((item: string) => {
        doc.text(`• ${item}`, margin + 5, yPosition, { maxWidth: contentWidth - 10 })
        yPosition += 4
      })
      yPosition += 2
    }

    // Deadline
    if (analysis.deadline_pressure) {
      doc.setFont("Helvetica", 'bold')
      doc.text('Deadline:', margin, yPosition)
      doc.setFont("Helvetica", 'normal')
      doc.text(analysis.deadline_pressure, margin + 18, yPosition, { maxWidth: contentWidth - 18 })
      yPosition += 6
    }

    yPosition += 4
  }

  // Recommended Response
  if (options.includeResponseTemplate) {
    doc.setFontSize(11)
    doc.setFont("Helvetica", 'bold')
    doc.text('Recommended Response Template', margin, yPosition)
    yPosition += 6

    doc.setFontSize(9)
    doc.setFont("Helvetica", 'normal')
    const responseTemplate = `Dear ${emailData.sender_email?.split('@')[0] || 'Sender'},

[Provide your response here]

Best regards`

    const responseLines = doc.splitTextToSize(responseTemplate, contentWidth)
    doc.text(responseLines, margin, yPosition)
    yPosition += responseLines.length * 4
  }

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(128, 128, 128)
  doc.text(
    `Export Date: ${new Date().toLocaleString()} | EXECOS Pro`,
    margin,
    pageHeight - 10
  )
  doc.text(`Page 1 of 1`, pageWidth - margin, pageHeight - 10, { align: 'right' })

  return Buffer.from(doc.output('arraybuffer'))
}

/**
 * Generate DOCX export with editable content
 */
async function generateDocxExport(
  emailData: any,
  analysis: any,
  options: ExportRequest
): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: 'EXECOS Pro Email Investigation',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `Export Date: ${new Date().toLocaleString()}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),

          // Email Section
          new Paragraph({
            text: 'Email Header',
            heading: HeadingLevel.HEADING_2,
          }),
          new Table({
            width: { size: 100, type: 'pct' },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph('From')],
                  }),
                  new TableCell({
                    children: [new Paragraph(emailData.sender_email || 'N/A')],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph('Subject')],
                  }),
                  new TableCell({
                    children: [new Paragraph(emailData.subject || 'N/A')],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph('Date')],
                  }),
                  new TableCell({
                    children: [new Paragraph(new Date(emailData.received_at).toLocaleString())],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({
            text: '',
            spacing: { before: 200, after: 200 },
          }),

          new Paragraph({
            text: 'Email Body',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph(emailData.body_text || 'N/A'),

          new Paragraph({
            text: '',
            spacing: { before: 200, after: 200 },
          }),

          ...(options.includeFullAnalysis && analysis
            ? [
                new Paragraph({
                  text: 'AI Analysis',
                  heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph({
                  text: `Sender Intent: ${analysis.sender_intent || 'N/A'}`,
                  spacing: { before: 100, after: 100 },
                }),
                new Paragraph({
                  text: `Risk Level: ${analysis.risk_level || 'Unknown'}`,
                  spacing: { before: 100, after: 100 },
                }),
                new Paragraph({
                  text: `Tone: ${analysis.tone || 'N/A'}`,
                  spacing: { before: 100, after: 100 },
                }),
                ...(analysis.action_items && analysis.action_items.length > 0
                  ? [
                      new Paragraph({
                        text: 'Action Items:',
                        spacing: { before: 100, after: 50 },
                      }),
                      ...analysis.action_items.map(
                        (item: string) =>
                          new Paragraph({
                            text: item,
                            bullet: {
                              level: 0,
                            },
                            spacing: { after: 50 },
                          })
                      ),
                    ]
                  : []),
              ]
            : []),

          new Paragraph({
            text: '',
            spacing: { before: 200, after: 200 },
          }),

          ...(options.includeResponseTemplate
            ? [
                new Paragraph({
                  text: 'Recommended Response',
                  heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph({
                  text: `Dear ${emailData.sender_email?.split('@')[0] || 'Sender'},`,
                  spacing: { before: 100, after: 100 },
                }),
                new Paragraph({
                  text: '[Provide your response here]',
                  spacing: { before: 100, after: 100 },
                }),
                new Paragraph({
                  text: 'Best regards',
                  spacing: { before: 100, after: 100 },
                }),
              ]
            : []),
        ],
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  return buffer
}

/**
 * Generate CSV export
 */
function generateCsvExport(emailData: any, analysis: any): string {
  const headers = ['From', 'Subject', 'Date', 'Summary', 'Risk', 'Actions', 'Deadline', 'Project', 'Site']
  const row = [
    emailData.sender_email || '',
    emailData.subject || '',
    new Date(emailData.received_at).toLocaleString(),
    analysis?.sender_intent || '',
    analysis?.risk_level || '',
    analysis?.action_items?.join('; ') || '',
    analysis?.deadline_pressure || '',
    '', // Project (would need lookup)
    '', // Site (would need lookup)
  ]

  const headerLine = headers.map((h) => `"${h}"`).join(',')
  const rowLine = row.map((v) => `"${v}"`).join(',')

  return `${headerLine}\n${rowLine}`
}

/**
 * Generate Markdown export
 */
function generateMarkdownExport(emailData: any, analysis: any): string {
  let md = `# Email Investigation Export\n\n`
  md += `**Export Date:** ${new Date().toLocaleString()}\n\n`

  md += `## Email Header\n\n`
  md += `- **From:** ${emailData.sender_email || 'N/A'}\n`
  md += `- **Subject:** ${emailData.subject || 'N/A'}\n`
  md += `- **Date:** ${new Date(emailData.received_at).toLocaleString()}\n\n`

  md += `## Email Body\n\n`
  md += `${emailData.body_text || 'N/A'}\n\n`

  if (analysis) {
    md += `## AI Analysis\n\n`
    md += `**Sender Intent:** ${analysis.sender_intent || 'N/A'}\n\n`
    md += `**Risk Level:** ${analysis.risk_level || 'Unknown'}\n\n`
    md += `**Tone:** ${analysis.tone || 'N/A'}\n\n`

    if (analysis.action_items && analysis.action_items.length > 0) {
      md += `### Action Items\n\n`
      analysis.action_items.forEach((item: string) => {
        md += `- ${item}\n`
      })
      md += `\n`
    }

    if (analysis.deadline_pressure) {
      md += `**Deadline:** ${analysis.deadline_pressure}\n\n`
    }
  }

  return md
}

/**
 * Generate HTML export
 */
function generateHtmlExport(emailData: any, analysis: any): string {
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Email Investigation - ${emailData.subject}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
    h1 { color: #192347; border-bottom: 3px solid #192347; padding-bottom: 10px; }
    h2 { color: #192347; margin-top: 30px; }
    .header-info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .analysis { background: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; margin: 20px 0; }
    .risk-high { background: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 20px 0; }
    .risk-yellow { background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; }
    .action-item { padding: 8px 0; margin-left: 20px; }
    .footer { color: #999; font-size: 12px; margin-top: 40px; border-top: 1px solid #ddd; padding-top: 10px; }
  </style>
</head>
<body>
  <h1>EXECOS Pro - Email Investigation</h1>
  
  <div class="header-info">
    <strong>From:</strong> ${emailData.sender_email || 'N/A'}<br>
    <strong>Subject:</strong> ${emailData.subject || 'N/A'}<br>
    <strong>Date:</strong> ${new Date(emailData.received_at).toLocaleString()}<br>
  </div>
  
  <h2>Email Body</h2>
  <p>${(emailData.body_text || 'N/A').replace(/\n/g, '<br>')}</p>`

  if (analysis) {
    const riskClass = `risk-${analysis.risk_level || 'yellow'}`
    html += `
  <div class="${riskClass}">
    <h2>AI Analysis</h2>
    <p><strong>Sender Intent:</strong> ${analysis.sender_intent || 'N/A'}</p>
    <p><strong>Risk Level:</strong> <strong>${analysis.risk_level?.toUpperCase() || 'Unknown'}</strong></p>
    <p><strong>Tone:</strong> ${analysis.tone || 'N/A'}</p>`

    if (analysis.action_items && analysis.action_items.length > 0) {
      html += `<h3>Action Items</h3><ul>`
      analysis.action_items.forEach((item: string) => {
        html += `<li class="action-item">${item}</li>`
      })
      html += `</ul>`
    }

    if (analysis.deadline_pressure) {
      html += `<p><strong>Deadline:</strong> ${analysis.deadline_pressure}</p>`
    }

    html += `</div>`
  }

  html += `
  <div class="footer">
    <p>Export Date: ${new Date().toLocaleString()}</p>
    <p>EXECOS Pro Email Investigation System</p>
  </div>
</body>
</html>`

  return html
}

/**
 * Main export handler
 */
export async function POST(request: Request) {
  try {
    const { emailId, format, includeAttachments, includeFullAnalysis, includeResponseTemplate, exportName }: ExportRequest =
      await request.json()

    if (!emailId || !format) {
      return Response.json({ error: 'Missing emailId or format' }, { status: 400 })
    }

    // Get email data
    const { data: emailData, error: emailError } = await supabase
      .from('emails')
      .select('*')
      .eq('id', emailId)
      .single()

    if (emailError || !emailData) {
      return Response.json({ error: 'Email not found' }, { status: 404 })
    }

    // Get analysis
    const { data: analysis } = await supabase
      .from('email_inferences')
      .select('*')
      .eq('email_id', emailId)
      .single()

    // Generate export in requested format
    let fileBuffer: Buffer | string
    let mimeType: string
    let fileExtension: string

    switch (format) {
      case 'pdf':
        fileBuffer = await generatePdfExport(emailData, analysis, {
          emailId,
          format,
          includeAttachments,
          includeFullAnalysis,
          includeResponseTemplate,
        })
        mimeType = 'application/pdf'
        fileExtension = 'pdf'
        break

      case 'docx':
        fileBuffer = await generateDocxExport(emailData, analysis, {
          emailId,
          format,
          includeAttachments,
          includeFullAnalysis,
          includeResponseTemplate,
        })
        mimeType =
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        fileExtension = 'docx'
        break

      case 'csv':
        fileBuffer = generateCsvExport(emailData, analysis)
        mimeType = 'text/csv'
        fileExtension = 'csv'
        break

      case 'md':
        fileBuffer = generateMarkdownExport(emailData, analysis)
        mimeType = 'text/markdown'
        fileExtension = 'md'
        break

      case 'html':
        fileBuffer = generateHtmlExport(emailData, analysis)
        mimeType = 'text/html'
        fileExtension = 'html'
        break

      case 'json':
        fileBuffer = JSON.stringify(
          {
            email: emailData,
            analysis: analysis,
            exportDate: new Date().toISOString(),
          },
          null,
          2
        )
        mimeType = 'application/json'
        fileExtension = 'json'
        break

      case 'txt':
      default:
        fileBuffer = `
EMAIL INVESTIGATION EXPORT
Export Date: ${new Date().toLocaleString()}

FROM: ${emailData.sender_email || 'N/A'}
SUBJECT: ${emailData.subject || 'N/A'}
DATE: ${new Date(emailData.received_at).toLocaleString()}

BODY:
${emailData.body_text || 'N/A'}

${
  analysis
    ? `
ANALYSIS:
Sender Intent: ${analysis.sender_intent || 'N/A'}
Risk Level: ${analysis.risk_level || 'Unknown'}
Tone: ${analysis.tone || 'N/A'}
${analysis.action_items?.length > 0 ? `Action Items:\n${analysis.action_items.map((i: string) => `  - ${i}`).join('\n')}` : ''}
${analysis.deadline_pressure ? `Deadline: ${analysis.deadline_pressure}` : ''}
`
    : ''
}
`
        mimeType = 'text/plain'
        fileExtension = 'txt'
        break
    }

    // Create filename
    const fileName = `${exportName || emailData.subject || 'email'}-${new Date().getTime()}.${fileExtension}`

    // Store in Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('email-exports')
      .upload(`${emailData.user_id}/${fileName}`, fileBuffer, {
        contentType: mimeType,
      })

    if (uploadError) {
      throw uploadError
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('email-exports')
      .getPublicUrl(`${emailData.user_id}/${fileName}`)

    // Record export in database
    const { data: exportRecord, error: dbError } = await supabase
      .from('email_exports')
      .insert({
        user_id: emailData.user_id,
        email_id: emailId,
        export_format: format,
        export_file_url: urlData.publicUrl,
        file_name: fileName,
        file_size: typeof fileBuffer === 'string' ? fileBuffer.length : fileBuffer.length,
        include_attachments: includeAttachments || false,
        include_full_analysis: includeFullAnalysis !== false,
        include_response_template: includeResponseTemplate !== false,
        export_type: 'single',
        exported_by: emailData.user_id,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
    }

    return Response.json({
      success: true,
      exportId: exportRecord?.id,
      fileName,
      fileUrl: urlData.publicUrl,
      format,
      size: typeof fileBuffer === 'string' ? fileBuffer.length : fileBuffer.length,
    })
  } catch (error) {
    console.error('Export error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    )
  }
}
