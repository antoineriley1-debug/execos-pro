/**
 * Bulk Investigation Results API
 * GET /api/investigations/bulk/[jobId]/results
 * Returns individual summaries + generates aggregate summary
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const claudeApiKey = process.env.CLAUDE_API_KEY || ''

const supabase = createClient(supabaseUrl, supabaseAnonKey)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

interface IndividualSummary {
  fileId: string
  filename: string
  summary: {
    key_findings: string
    risk_score: number
    risk_level: string
    entities_found: Record<string, any>
    sentiment: string
  }
}

interface AggregateSummary {
  aggregate_summary: string
  common_themes: string[]
  top_risks: string[]
  all_entities: Record<string, any>
  average_risk_score: number
  sentiment_distribution: Record<string, number>
}

interface ResultsResponse {
  jobId: string
  individual: IndividualSummary[]
  aggregate: AggregateSummary
  risks: Array<{
    risk_level: string
    count: number
    percentage: number
  }>
  entities: Record<string, string[]>
}

async function generateAggregateSummary(
  _jobId: string,
  _userId: string,
  summaries: any[]
): Promise<AggregateSummary | null> {
  try {
    if (!claudeApiKey || summaries.length === 0) {
      return null
    }

    // Prepare summary data for Claude
    const summaryTexts = summaries
      .map(
        (s, i) =>
          `Document ${i + 1}: ${s.key_findings} (Risk: ${s.risk_level}, Score: ${s.risk_score})`
      )
      .join('\n')

    const allEntities: Record<string, Set<string>> = {}
    const sentiments: Record<string, number> = {
      negative: 0,
      neutral: 0,
      positive: 0,
    }
    const riskScores: number[] = []

    for (const summary of summaries) {
      if (summary.sentiment) {
        sentiments[summary.sentiment] = (sentiments[summary.sentiment] || 0) + 1
      }
      riskScores.push(summary.risk_score)

      if (summary.entities_found) {
        for (const [type, entities] of Object.entries(
          summary.entities_found
        )) {
          if (!allEntities[type]) {
            allEntities[type] = new Set()
          }
          if (Array.isArray(entities)) {
            entities.forEach((e: any) => allEntities[type].add(String(e)))
          }
        }
      }
    }

    // Calculate statistics
    const averageRiskScore =
      riskScores.length > 0
        ? Math.round(riskScores.reduce((a, b) => a + b) / riskScores.length)
        : 0

    // Convert Sets to Arrays
    const entitiesObj: Record<string, string[]> = {}
    for (const [type, entities] of Object.entries(allEntities)) {
      entitiesObj[type] = Array.from(entities)
    }

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
            content: `Analyze these ${summaries.length} investigation summaries and provide a JSON response with this exact structure:
{
  "aggregate_summary": "2-3 paragraph comprehensive summary of all findings",
  "common_themes": ["theme1", "theme2", "theme3"],
  "top_risks": ["risk1", "risk2", "risk3"]
}

Summaries:
${summaryTexts}

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
    const analysis = JSON.parse(analysisText)

    return {
      aggregate_summary: analysis.aggregate_summary || '',
      common_themes: analysis.common_themes || [],
      top_risks: analysis.top_risks || [],
      all_entities: entitiesObj,
      average_risk_score: averageRiskScore,
      sentiment_distribution: sentiments,
    }
  } catch (error) {
    console.error('Aggregate summary generation error:', error)
    return null
  }
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

    // Fetch individual summaries
    const { data: fileData, error: filesError } = await supabaseAdmin
      .from('investigation_files')
      .select('id, original_filename')
      .eq('bulk_investigation_id', jobId)
      .eq('user_id', userId)
      .eq('status', 'analyzed')

    if (filesError) {
      console.error('Files fetch error:', filesError)
      return NextResponse.json(
        { error: 'Failed to fetch results' },
        { status: 500 }
      )
    }

    // Fetch summaries for all analyzed files
    const fileIds = (fileData || []).map((f) => f.id)
    const individual: IndividualSummary[] = []
    const summaryDataForAggregate = []

    if (fileIds.length > 0) {
      const { data: summaries, error: summariesError } = await supabaseAdmin
        .from('investigation_summaries')
        .select('*')
        .in('investigation_file_id', fileIds)

      if (summariesError) {
        console.error('Summaries fetch error:', summariesError)
        return NextResponse.json(
          { error: 'Failed to fetch summaries' },
          { status: 500 }
        )
      }

      // Build individual summaries
      for (const summary of summaries || []) {
        const file = fileData.find((f) => f.id === summary.investigation_file_id)
        if (file) {
          individual.push({
            fileId: summary.investigation_file_id,
            filename: file.original_filename,
            summary: {
              key_findings: summary.key_findings,
              risk_score: summary.risk_score,
              risk_level: summary.risk_level,
              entities_found: summary.entities_found || {},
              sentiment: summary.sentiment,
            },
          })
          summaryDataForAggregate.push(summary)
        }
      }
    }

    // Check if aggregate already exists
    let aggregate: AggregateSummary | null = null
    const { data: existingAggregate } = await supabaseAdmin
      .from('investigation_aggregates')
      .select('*')
      .eq('bulk_investigation_id', jobId)
      .eq('user_id', userId)
      .maybeSingle()

    if (existingAggregate) {
      aggregate = {
        aggregate_summary: existingAggregate.aggregate_summary,
        common_themes: existingAggregate.common_themes || [],
        top_risks: existingAggregate.top_risks || [],
        all_entities: existingAggregate.all_entities || {},
        average_risk_score: existingAggregate.average_risk_score || 0,
        sentiment_distribution: existingAggregate.sentiment_distribution || {},
      }
    } else if (summaryDataForAggregate.length > 0) {
      // Generate new aggregate
      const generated = await generateAggregateSummary(
        jobId,
        userId,
        summaryDataForAggregate
      )

      if (generated) {
        // Store aggregate in database
        const { error: aggregateError } = await supabaseAdmin
          .from('investigation_aggregates')
          .insert({
            user_id: userId,
            bulk_investigation_id: jobId,
            aggregate_summary: generated.aggregate_summary,
            common_themes: generated.common_themes,
            top_risks: generated.top_risks,
            all_entities: generated.all_entities,
            average_risk_score: generated.average_risk_score,
            sentiment_distribution: generated.sentiment_distribution,
          })

        if (aggregateError) {
          console.error('Aggregate storage error:', aggregateError)
        }

        aggregate = generated
      }
    }

    // Prepare risk distribution
    const riskCounts = { low: 0, medium: 0, high: 0 }
    for (const summary of individual) {
      const level = summary.summary.risk_level
      if (level in riskCounts) {
        riskCounts[level as keyof typeof riskCounts]++
      }
    }

    const totalRisks = individual.length
    const risks = [
      {
        risk_level: 'low',
        count: riskCounts.low,
        percentage: totalRisks > 0 ? Math.round((riskCounts.low / totalRisks) * 100) : 0,
      },
      {
        risk_level: 'medium',
        count: riskCounts.medium,
        percentage: totalRisks > 0 ? Math.round((riskCounts.medium / totalRisks) * 100) : 0,
      },
      {
        risk_level: 'high',
        count: riskCounts.high,
        percentage: totalRisks > 0 ? Math.round((riskCounts.high / totalRisks) * 100) : 0,
      },
    ]

    // Combine all entities
    const entities: Record<string, string[]> = {}
    for (const summary of individual) {
      for (const [type, values] of Object.entries(summary.summary.entities_found)) {
        if (!entities[type]) {
          entities[type] = []
        }
        if (Array.isArray(values)) {
          entities[type].push(...values.map(String))
        }
      }
    }

    // Remove duplicates
    for (const type in entities) {
      entities[type] = [...new Set(entities[type])]
    }

    const response: ResultsResponse = {
      jobId,
      individual,
      aggregate: aggregate || {
        aggregate_summary: 'Aggregate summary could not be generated',
        common_themes: [],
        top_risks: [],
        all_entities: entities,
        average_risk_score: 0,
        sentiment_distribution: {},
      },
      risks,
      entities,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Results endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
