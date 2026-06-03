import { createHash } from 'crypto'
import mammoth from 'mammoth'

export interface FileMetadata {
  filename: string
  mimetype: string
  size: number
  hash: string
  extractedAt: string
}

export interface ParsedFile {
  content: string
  metadata: FileMetadata
  language?: string
  encoding?: string
}

export interface EmailMetadata {
  from?: string
  to?: string[]
  cc?: string[]
  subject?: string
  date?: string
  messageId?: string
}

export interface ParsedEmail extends ParsedFile {
  emailMetadata: EmailMetadata
}

export interface Entity {
  value: string
  type: 'email' | 'phone' | 'person' | 'organization' | 'location' | 'other'
  confidence: number
  source?: string
}

export interface RiskAssessment {
  riskLevel: 'critical' | 'high' | 'medium' | 'low'
  score: number
  indicators: Array<{
    type: string
    description: string
    severity: number
  }>
  recommendations: string[]
}

/**
 * Extracts text from .eml and .msg email files
 */
export async function parseEmailFile(
  buffer: Buffer,
  filename: string
): Promise<ParsedEmail> {
  try {
    const content = buffer.toString('utf8')

    // Parse email headers and body
    const emailMetadata: EmailMetadata = {}
    let bodyStartIndex = content.indexOf('\n\n')
    if (bodyStartIndex === -1) bodyStartIndex = content.indexOf('\r\n\r\n')

    const headers = content.substring(0, bodyStartIndex || 0)
    const body = content.substring(bodyStartIndex + 2 || 0)

    // Extract common email headers
    const fromMatch = headers.match(/^From:\s*(.+?)$/m)
    const toMatch = headers.match(/^To:\s*(.+?)$/m)
    const ccMatch = headers.match(/^Cc:\s*(.+?)$/m)
    const subjectMatch = headers.match(/^Subject:\s*(.+?)$/m)
    const dateMatch = headers.match(/^Date:\s*(.+?)$/m)
    const messageIdMatch = headers.match(/^Message-ID:\s*(.+?)$/m)

    if (fromMatch) emailMetadata.from = fromMatch[1].trim()
    if (toMatch)
      emailMetadata.to = toMatch[1]
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean)
    if (ccMatch)
      emailMetadata.cc = ccMatch[1]
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean)
    if (subjectMatch) emailMetadata.subject = subjectMatch[1].trim()
    if (dateMatch) emailMetadata.date = dateMatch[1].trim()
    if (messageIdMatch) emailMetadata.messageId = messageIdMatch[1].trim()

    const hash = createHash('sha256').update(buffer).digest('hex')

    return {
      content: body.trim(),
      metadata: {
        filename,
        mimetype: filename.endsWith('.msg') ? 'application/vnd.ms-outlook' : 'message/rfc822',
        size: buffer.length,
        hash,
        extractedAt: new Date().toISOString(),
      },
      emailMetadata,
    }
  } catch (error) {
    throw new Error(
      `Email parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Extracts text from PDF files using pdf-parse
 */
export async function extractTextFromPdf(
  buffer: Buffer,
  filename: string
): Promise<ParsedFile> {
  // PDF parsing disabled - use a PDF library like pdfjs-dist or pdf-parse if needed
  const hash = createHash('sha256').update(buffer).digest('hex')

  return {
    content: '[PDF content extraction not available]',
    metadata: {
      filename,
      mimetype: 'application/pdf',
      size: buffer.length,
      hash,
      extractedAt: new Date().toISOString(),
    },
  }
}

/**
 * Extracts text from DOCX files using mammoth
 */
export async function extractTextFromDocx(
  buffer: Buffer,
  filename: string
): Promise<ParsedFile> {
  try {
    const result = await mammoth.extractRawText({ buffer })

    const hash = createHash('sha256').update(buffer).digest('hex')

    return {
      content: result.value.trim(),
      metadata: {
        filename,
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: buffer.length,
        hash,
        extractedAt: new Date().toISOString(),
      },
    }
  } catch (error) {
    throw new Error(
      `DOCX extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Parses plain text files
 */
export function parsePlainText(
  buffer: Buffer,
  filename: string,
  encoding: BufferEncoding = 'utf8'
): ParsedFile {
  try {
    const content = buffer.toString(encoding)
    const hash = createHash('sha256').update(buffer).digest('hex')

    return {
      content: content.trim(),
      metadata: {
        filename,
        mimetype: 'text/plain',
        size: buffer.length,
        hash,
        extractedAt: new Date().toISOString(),
      },
      encoding,
    }
  } catch (error) {
    throw new Error(
      `Text parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Routes file parsing based on mimetype or extension
 */
export async function parseFile(
  buffer: Buffer,
  filename: string,
  mimetype?: string
): Promise<ParsedFile | ParsedEmail> {
  const ext = filename.split('.').pop()?.toLowerCase()
  const type = mimetype || getMimetypeFromExtension(ext)

  switch (type) {
    case 'message/rfc822':
    case 'application/vnd.ms-outlook':
      return parseEmailFile(buffer, filename)
    case 'application/pdf':
      return extractTextFromPdf(buffer, filename)
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return extractTextFromDocx(buffer, filename)
    case 'text/plain':
      return parsePlainText(buffer, filename)
    default:
      // Try text as fallback
      return parsePlainText(buffer, filename)
  }
}

/**
 * Generates SHA256 hash for file (for duplicate detection)
 */
export function hashFile(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex')
}

/**
 * Detects duplicates in a file batch
 */
export function detectDuplicates(
  files: Array<{ buffer: Buffer; filename: string }>
): {
  unique: Array<{ hash: string; filename: string }>
  duplicates: Map<string, string[]>
} {
  const hashes = new Map<string, string[]>()
  const unique: Array<{ hash: string; filename: string }> = []

  for (const file of files) {
    const hash = hashFile(file.buffer)

    if (!hashes.has(hash)) {
      hashes.set(hash, [])
      unique.push({ hash, filename: file.filename })
    }

    hashes.get(hash)!.push(file.filename)
  }

  // Find duplicates (hashes with more than one file)
  const duplicates = new Map<string, string[]>()
  for (const [hash, files] of hashes) {
    if (files.length > 1) {
      duplicates.set(hash, files)
    }
  }

  return { unique, duplicates }
}

/**
 * Parses Claude response for risk assessment
 */
export function generateRiskScore(claudeResponse: string): RiskAssessment {
  let riskLevel: 'critical' | 'high' | 'medium' | 'low' = 'medium'
  let score = 0.5

  try {
    // Try JSON parsing first
    try {
      const parsed = JSON.parse(claudeResponse) as RiskAssessment
      if (parsed.riskLevel && parsed.score) {
        return parsed
      }
    } catch {
      // Not JSON, continue with text parsing
    }

    // Text parsing
    const responseLower = claudeResponse.toLowerCase()

    if (responseLower.includes('critical')) {
      riskLevel = 'critical'
      score = 0.9
    } else if (responseLower.includes('high')) {
      riskLevel = 'high'
      score = 0.7
    } else if (responseLower.includes('low')) {
      riskLevel = 'low'
      score = 0.3
    } else if (responseLower.includes('medium')) {
      riskLevel = 'medium'
      score = 0.5
    }

    // Extract indicators
    const indicators: RiskAssessment['indicators'] = []
    const indicatorMatches = claudeResponse.match(
      /(?:indicator|concern|issue|finding)[\s:]+([^\n.!?]+[.!?]?)/gi
    )

    if (indicatorMatches) {
      for (const match of indicatorMatches.slice(0, 5)) {
        indicators.push({
          type: 'extracted',
          description: match.replace(/^(?:indicator|concern|issue|finding)[\s:]+/i, ''),
          severity: score,
        })
      }
    }

    return {
      riskLevel,
      score,
      indicators,
      recommendations: extractRecommendations(claudeResponse),
    }
  } catch (error) {
    console.error(
      'Error generating risk score:',
      error instanceof Error ? error.message : 'Unknown error'
    )
    return {
      riskLevel: 'medium',
      score: 0.5,
      indicators: [],
      recommendations: [],
    }
  }
}

/**
 * Extracts recommendations from Claude response
 */
function extractRecommendations(text: string): string[] {
  const recommendations: string[] = []

  const recMatches = text.match(
    /(?:recommend|suggest|advise)[\s:]+([^\n.!?]+[.!?]?)/gi
  )

  if (recMatches) {
    for (const match of recMatches.slice(0, 5)) {
      const cleaned = match.replace(/^(?:recommend|suggest|advise)[\s:]+/i, '')
      if (cleaned.length > 10) {
        recommendations.push(cleaned)
      }
    }
  }

  return recommendations
}

/**
 * Consolidates entities from multiple parsed files
 */
export function consolidateEntities(
  parsedFiles: Array<ParsedFile | ParsedEmail>
): Entity[] {
  const entities = new Map<string, Entity>()

  // Email regex patterns
  const emailPattern =
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
  const phonePattern = /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g

  for (const file of parsedFiles) {
    const content = file.content

    // Extract emails
    const emailMatches = content.matchAll(emailPattern)
    for (const match of emailMatches) {
      const email = match[0].toLowerCase()
      if (!entities.has(email)) {
        entities.set(email, {
          value: email,
          type: 'email',
          confidence: 0.95,
          source: file.metadata.filename,
        })
      } else {
        const entity = entities.get(email)!
        entity.confidence = Math.min(1, entity.confidence + 0.05)
      }
    }

    // Extract phone numbers
    const phoneMatches = content.matchAll(phonePattern)
    for (const match of phoneMatches) {
      const phone = match[0]
      if (!entities.has(phone)) {
        entities.set(phone, {
          value: phone,
          type: 'phone',
          confidence: 0.85,
          source: file.metadata.filename,
        })
      }
    }

    // Extract email metadata if available
    if ('emailMetadata' in file && file.emailMetadata) {
      const { from, to, cc } = file.emailMetadata
      const emails = [from, ...(to || []), ...(cc || [])].filter(Boolean)

      for (const email of emails) {
        if (email && !entities.has(email)) {
          entities.set(email, {
            value: email,
            type: 'email',
            confidence: 0.98,
            source: file.metadata.filename,
          })
        }
      }
    }
  }

  return Array.from(entities.values()).sort((a, b) => b.confidence - a.confidence)
}

/**
 * Gets mimetype from file extension
 */
function getMimetypeFromExtension(ext?: string): string {
  const types: Record<string, string> = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
    eml: 'message/rfc822',
    msg: 'application/vnd.ms-outlook',
    txt: 'text/plain',
  }

  return types[ext?.toLowerCase() || ''] || 'text/plain'
}

/**
 * Validates parsed content
 */
export function validateParsedContent(file: ParsedFile): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!file.content || file.content.trim().length === 0) {
    errors.push('No content extracted from file')
  }

  if (file.content.length > 10_000_000) {
    // 10MB limit
    errors.push('Extracted content exceeds maximum size of 10MB')
  }

  if (!file.metadata.hash || file.metadata.hash.length !== 64) {
    errors.push('Invalid file hash')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
