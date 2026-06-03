import { createHash } from 'crypto'
import zlib from 'zlib'
import { promisify } from 'util'

const gzip = promisify(zlib.gzip)
const gunzip = promisify(zlib.gunzip)

export interface SynthesisData {
  [key: string]: unknown
}

export interface CompressionResult {
  compressed: Buffer
  originalSize: number
  compressedSize: number
  ratio: number
  hash: string
}

export interface FormattedSynthesisInput {
  summary: string
  dataPoints: Array<{
    key: string
    value: unknown
    confidence: number
  }>
  timestamp: string
  metadata: Record<string, unknown>
}

export interface KeyInsights {
  findings: string[]
  risks: Array<{
    level: 'critical' | 'high' | 'medium' | 'low'
    description: string
  }>
  actors: Array<{
    name: string
    role: string
    confidence: number
  }>
  recommendations: string[]
}

export interface TokenMetrics {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  estimatedCost: number
  model: string
}

/**
 * Compresses synthesis data with token optimization
 * Uses gzip compression and tracks compression ratio for cost analysis
 */
export async function compressSynthesis(
  data: SynthesisData
): Promise<CompressionResult> {
  try {
    const jsonString = JSON.stringify(data)
    const originalSize = Buffer.byteLength(jsonString, 'utf8')

    const compressed = await gzip(jsonString, {
      level: 9, // Maximum compression
      memLevel: 9,
    })

    const compressedSize = compressed.length
    const ratio = compressedSize / originalSize

    const hash = createHash('sha256').update(jsonString).digest('hex')

    return {
      compressed,
      originalSize,
      compressedSize,
      ratio,
      hash,
    }
  } catch (error) {
    throw new Error(
      `Compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Decompresses synthesis data
 */
export async function decompressSynthesis(
  compressed: Buffer
): Promise<SynthesisData> {
  try {
    const decompressed = await gunzip(compressed)
    const jsonString = decompressed.toString('utf8')
    return JSON.parse(jsonString) as SynthesisData
  } catch (error) {
    throw new Error(
      `Decompression failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Formats aggregated data for Claude synthesis
 * Optimizes for token usage while preserving critical information
 */
export function formatDataForSynthesis(
  data: SynthesisData,
  options: { maxTokens?: number; summarize?: boolean } = {}
): FormattedSynthesisInput {
  const { maxTokens = 4000, summarize = true } = options

  // Calculate approximate tokens (rough estimate: ~4 chars per token)
  const estimatedTokens = JSON.stringify(data).length / 4

  const dataPoints = Object.entries(data)
    .map(([key, value]) => {
      let confidence: number = 0.8
      if (typeof value === 'object' && value !== null && 'confidence' in value) {
        const confVal = (value as Record<string, unknown>).confidence
        confidence = typeof confVal === 'number' ? confVal : 0.8
      }
      return {
        key,
        value,
        confidence,
      }
    })
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, Math.ceil(maxTokens / 100)) // Limit data points

  const summary = summarize
    ? `Analysis of ${Object.keys(data).length} data points with ${(estimatedTokens / maxTokens) * 100}% token ratio`
    : `Complete data set with ${Object.keys(data).length} data points`

  return {
    summary,
    dataPoints: dataPoints as any,
    timestamp: new Date().toISOString(),
    metadata: {
      totalDataPoints: Object.keys(data).length,
      selectedDataPoints: dataPoints.length,
      estimatedTokens,
      compressionApplied: estimatedTokens > maxTokens,
    },
  }
}

/**
 * Extracts structured insights from Claude response
 * Parses findings, risks, actors, and recommendations
 */
export function extractKeyInsights(claudeResponse: string): KeyInsights {
  const insights: KeyInsights = {
    findings: [],
    risks: [],
    actors: [],
    recommendations: [],
  }

  try {
    // Try to parse as JSON if Claude returned structured format
    try {
      const parsed = JSON.parse(claudeResponse) as KeyInsights
      if (parsed.findings && parsed.risks && parsed.actors) {
        return parsed
      }
    } catch {
      // Not JSON, proceed with text parsing
    }

    // Parse text response
    const lines = claudeResponse.split('\n')
    let currentSection = ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      // Detect section headers
      if (
        trimmed.toLowerCase().includes('finding') ||
        trimmed.toLowerCase().includes('key finding')
      ) {
        currentSection = 'findings'
      } else if (
        trimmed.toLowerCase().includes('risk') ||
        trimmed.toLowerCase().includes('threat')
      ) {
        currentSection = 'risks'
      } else if (
        trimmed.toLowerCase().includes('actor') ||
        trimmed.toLowerCase().includes('person') ||
        trimmed.toLowerCase().includes('individual')
      ) {
        currentSection = 'actors'
      } else if (
        trimmed.toLowerCase().includes('recommendation') ||
        trimmed.toLowerCase().includes('suggest')
      ) {
        currentSection = 'recommendations'
      } else if (currentSection && !trimmed.startsWith('#')) {
        // Add to current section if we're in one
        if (currentSection === 'findings') {
          insights.findings.push(trimmed)
        } else if (currentSection === 'risks') {
          // Try to extract risk level
          const riskMatch = trimmed.match(
            /(critical|high|medium|low)[\s-:]/i
          )
          const level = (
            riskMatch
              ? riskMatch[1].toLowerCase()
              : 'medium'
          ) as 'critical' | 'high' | 'medium' | 'low'
          insights.risks.push({
            level,
            description: trimmed.replace(/^\[(critical|high|medium|low)\]\s*/i, ''),
          })
        } else if (currentSection === 'actors') {
          // Try to extract actor details
          const nameMatch = trimmed.match(/^([^-\(]+)/)
          const roleMatch = trimmed.match(/(?:Role|role)[\s:]+([^,\n]+)/)
          insights.actors.push({
            name: nameMatch ? nameMatch[1].trim() : trimmed,
            role: roleMatch ? roleMatch[1].trim() : 'Unknown',
            confidence: 0.8,
          })
        } else if (currentSection === 'recommendations') {
          insights.recommendations.push(trimmed)
        }
      }
    }

    return insights
  } catch (error) {
    console.error(
      'Error extracting insights:',
      error instanceof Error ? error.message : 'Unknown error'
    )
    return insights
  }
}

/**
 * Calculates token usage and cost metrics
 * Supports major Claude models with estimated pricing
 */
export function calculateTokenUsage(
  inputTokens: number,
  outputTokens: number,
  model: 'claude-opus-4-7' | 'claude-sonnet-4-6' | 'claude-haiku-4-5-20251001' = 'claude-opus-4-7'
): TokenMetrics {
  // Pricing as of 2024 (USD per 1M tokens)
  const pricing: Record<string, { input: number; output: number }> = {
    'claude-opus-4-7': { input: 15, output: 45 },
    'claude-sonnet-4-6': { input: 3, output: 15 },
    'claude-haiku-4-5-20251001': { input: 0.8, output: 4 },
  }

  const rates = pricing[model] || pricing['claude-opus-4-7']
  const inputCost = (inputTokens / 1_000_000) * rates.input
  const outputCost = (outputTokens / 1_000_000) * rates.output
  const totalCost = inputCost + outputCost

  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    estimatedCost: totalCost,
    model,
  }
}

/**
 * Validates synthesis data for completeness
 */
export function validateSynthesisData(data: SynthesisData): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!data || typeof data !== 'object') {
    errors.push('Data must be a non-null object')
  }

  if (Object.keys(data).length === 0) {
    errors.push('Data cannot be empty')
  }

  const jsonSize = JSON.stringify(data).length
  if (jsonSize > 50_000_000) {
    // 50MB limit
    errors.push('Data exceeds maximum size of 50MB')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
