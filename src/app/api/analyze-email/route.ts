import { NextRequest, NextResponse } from 'next/server'

// Placeholder AI analysis using Claude API
// In production, this would call the Claude API via the backend

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY

export async function POST(request: NextRequest) {
  try {
    const { emailText } = await request.json()

    if (!emailText) {
      return NextResponse.json(
        { error: 'Email text is required' },
        { status: 400 }
      )
    }

    if (!CLAUDE_API_KEY) {
      return NextResponse.json(
        { error: 'Claude API key not configured' },
        { status: 500 }
      )
    }

    // Call Claude API to analyze the email
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Analyze this email and provide a JSON response with the following structure:
{
  "summary": "2-3 sentence summary",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "actionItems": ["action 1", "action 2"],
  "sentiment": "positive|neutral|negative",
  "confidence": 0.0-1.0
}

Email to analyze:
${emailText}

Respond ONLY with valid JSON, no markdown formatting.`,
          },
        ],
      }),
    })

    if (!claudeResponse.ok) {
      const error = await claudeResponse.text()
      console.error('Claude API error:', error)
      return NextResponse.json(
        { error: 'Failed to analyze email with Claude API' },
        { status: 500 }
      )
    }

    const claudeData = await claudeResponse.json()
    
    // Extract the text content from Claude's response
    const analysisText = claudeData.content[0].text
    
    // Parse the JSON response
    const analysis = JSON.parse(analysisText)

    return NextResponse.json({
      id: `summary_${Date.now()}`,
      summary: analysis.summary,
      keyPoints: analysis.keyPoints,
      actionItems: analysis.actionItems,
      sentiment: analysis.sentiment,
      confidence: analysis.confidence,
    })
  } catch (error) {
    console.error('Email analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze email' },
      { status: 500 }
    )
  }
}
