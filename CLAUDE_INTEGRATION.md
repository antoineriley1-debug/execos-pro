# Claude API Integration Guide

This document explains how the Claude AI integration works in EXECOS Pro.

---

## Overview

EXECOS Pro uses **Claude 3.5 Sonnet** for intelligent email analysis via the Email Intel module.

### Current Implementation

**Endpoint**: `POST /api/analyze-email`

**Flow**:
```
User Input (Email Text)
        ↓
Client-side Form (src/components/EmailIntelModule.tsx)
        ↓
Next.js API Route (src/app/api/analyze-email/route.ts)
        ↓
Claude API (Anthropic)
        ↓
Parsed JSON Response
        ↓
Display Results in UI
```

---

## Setup

### 1. Get Claude API Key

1. Go to https://console.anthropic.com
2. Create account or sign in
3. Go to **API Keys** section
4. Click **Create Key**
5. Copy the key (starts with `sk-ant-`)

### 2. Add to Environment

In `.env.local`:
```
CLAUDE_API_KEY=sk-ant-your_key_here
```

### 3. Verify Key is Valid

The first email analysis will verify the key works. If you get a 401 error, the key is invalid or expired.

---

## API Endpoint Reference

### POST /api/analyze-email

**Purpose**: Analyze email text and return structured insights

**Request**:
```json
{
  "emailText": "From: john@example.com\nTo: you@example.com\nSubject: Project Update\n\nHi,\n\nThe project is on track..."
}
```

**Response** (200 OK):
```json
{
  "id": "summary_1717372800123",
  "summary": "Project update indicating work is progressing on schedule with key milestones completed.",
  "keyPoints": [
    "Project is on schedule",
    "Key milestones completed",
    "Timeline met expectations"
  ],
  "actionItems": [
    "Review project status report",
    "Confirm resource availability"
  ],
  "sentiment": "positive",
  "confidence": 0.92
}
```

**Error Responses**:
- 400: Missing emailText
- 500: Claude API error (missing key, rate limit, etc)

---

## Prompt Engineering

The system prompt sent to Claude is designed to:

1. **Parse email structure** - Extract metadata (from, to, subject)
2. **Summarize content** - 2-3 sentence overview
3. **Identify key points** - 3-5 main talking points
4. **Extract action items** - Tasks implied or explicit
5. **Classify sentiment** - positive, neutral, or negative
6. **Confidence scoring** - 0.0-1.0 based on clarity

**Prompt Template**:
```
Analyze this email and provide a JSON response with the following structure:
{
  "summary": "2-3 sentence summary",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "actionItems": ["action 1", "action 2"],
  "sentiment": "positive|neutral|negative",
  "confidence": 0.0-1.0
}

Email to analyze:
[EMAIL TEXT HERE]

Respond ONLY with valid JSON, no markdown formatting.
```

---

## Response Format

Claude returns valid JSON with:

| Field | Type | Example |
|-------|------|---------|
| `summary` | string | "Email about Q2 project status update..." |
| `keyPoints` | string[] | ["75% complete", "On schedule", "No blockers"] |
| `actionItems` | string[] | ["Send report to stakeholders", "Schedule review meeting"] |
| `sentiment` | string | "positive", "neutral", or "negative" |
| `confidence` | number | 0.92 (0.0 to 1.0) |

---

## Rate Limits

Claude API has the following limits:

- **Free tier**: 1 request per minute, up to 10 requests per day
- **Paid tier**: Based on usage, starting at $3/million input tokens, $15/million output tokens

### Optimization Tips

1. **Batch emails** - Process multiple emails in one call if possible
2. **Cache results** - Store summaries in database to avoid re-analysis
3. **Limit length** - Claude works best with emails < 10,000 tokens (~40,000 characters)
4. **Pagination** - For large organizations, process emails in batches

---

## Advanced Usage

### Custom Analysis Prompts

To customize the analysis, edit `/src/app/api/analyze-email/route.ts`:

**Find this section**:
```typescript
messages: [
  {
    role: 'user',
    content: `Analyze this email and provide...`
  }
]
```

**Modify the prompt** to request different fields:
```javascript
// Example: Add actionable deadlines
content: `Analyze this email and return:
{
  "summary": "...",
  "keyPoints": [...],
  "actionItems": [...],
  "deadlines": ["2024-06-30", "2024-07-15"],
  "requiredApprovals": [...],
  "sentiment": "...",
  "confidence": 0.0-1.0
}
...`
```

### Storing Results

To save analysis to Supabase:

```typescript
// In route.ts, after getting analysis:
const { error } = await supabase
  .from('ai_summaries')
  .insert([
    {
      site_id: 'user_site_id',
      source_type: 'email',
      source_id: 'email_id',
      summary: analysis.summary,
      key_points: analysis.keyPoints,
      action_items: analysis.actionItems,
      sentiment: analysis.sentiment,
      confidence: analysis.confidence,
    }
  ])
```

### Batch Processing

For processing multiple emails:

```typescript
// Process array of emails
const results = await Promise.all(
  emails.map(email => 
    fetch('/api/analyze-email', {
      method: 'POST',
      body: JSON.stringify({ emailText: email })
    })
    .then(r => r.json())
  )
)
```

---

## Models Available

Claude offers several models at different price/performance tiers:

| Model | Speed | Cost | Best For |
|-------|-------|------|----------|
| claude-3-opus-20240229 | Slow | High | Complex analysis |
| **claude-3-5-sonnet-20241022** | **Medium** | **Balanced** | **Email analysis (current)** |
| claude-3-haiku-20240307 | Fast | Low | Simple tasks |

**Current choice**: Sonnet (good balance of speed and accuracy for email analysis)

To change model, edit line in `route.ts`:
```typescript
model: 'claude-3-5-sonnet-20241022', // Change here
```

---

## Error Handling

### Common Errors

**401 Unauthorized**
```
Solution: Check CLAUDE_API_KEY in .env.local is valid
- Verify key in Anthropic console hasn't expired
- Check for typos or trailing spaces
```

**429 Too Many Requests**
```
Solution: You've hit rate limits
- Wait before making next request
- Implement exponential backoff
- Upgrade to paid plan for higher limits
```

**500 Internal Server Error**
```
Solution: Check server logs
- Verify email text is valid (not empty)
- Check for malformed JSON in response
- Enable logging to debug
```

### Debug Logging

Add logging to `route.ts`:

```typescript
export async function POST(request: NextRequest) {
  const { emailText } = await request.json()
  
  console.log('📧 Analyzing email:', emailText.substring(0, 100))
  
  const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
    // ... config
  })
  
  console.log('🤖 Claude response status:', claudeResponse.status)
  const claudeData = await claudeResponse.json()
  console.log('📊 Analysis result:', claudeData)
  
  // ... rest of code
}
```

---

## Cost Estimation

Based on Claude 3.5 Sonnet pricing:

| Scenario | Tokens | Cost |
|----------|--------|------|
| 1 email analysis | ~500 | $0.002 |
| 100 emails/day | ~50,000 | $0.20 |
| 1000 emails/month | ~500,000 | $2.00 |
| 10,000 emails/month | ~5,000,000 | $20.00 |

---

## Best Practices

1. **Input Validation**
   - Check email text is not empty
   - Limit length to 50,000 characters
   - Sanitize input before sending to API

2. **Error Handling**
   - Catch timeout errors (set 30s timeout)
   - Retry failed requests with backoff
   - Fallback to cached results if available

3. **Performance**
   - Cache results to avoid re-analysis
   - Process in background for bulk emails
   - Show loading state to users

4. **Security**
   - Never log full emails
   - Keep API key in environment variables
   - Use rate limiting on your endpoint
   - Validate user has permission to analyze email

5. **Quality**
   - Test with various email types
   - Monitor confidence scores
   - Refine prompts based on results
   - A/B test different prompt variations

---

## Extending the Integration

### Add Custom Fields

**Example**: Extract sender company from email domain

```typescript
// In prompt, add extraction instruction
"senderCompany": "Extract company from email domain (e.g., @acme.com → Acme Corp)"

// In response parsing
const analysis = JSON.parse(analysisText)
const senderCompany = analysis.senderCompany || 'Unknown'
```

### Multi-language Support

```typescript
// Add language detection first
const language = await detectLanguage(emailText)

// Adjust prompt
content: `Analyze this ${language} email...`
```

### Sentiment-based Routing

```typescript
// Route emails based on sentiment
if (analysis.sentiment === 'negative') {
  // Alert manager
  await notifyManager(analysis)
}
```

---

## Testing

### Manual Test

```bash
curl -X POST http://localhost:3000/api/analyze-email \
  -H "Content-Type: application/json" \
  -d '{
    "emailText": "Hi, can you send me the Q2 report by Friday? Thanks"
  }'
```

### Automated Tests

```typescript
// __tests__/analyze-email.test.ts
describe('Email Analysis API', () => {
  it('should analyze email correctly', async () => {
    const response = await fetch('/api/analyze-email', {
      method: 'POST',
      body: JSON.stringify({
        emailText: 'Test email content'
      })
    })
    
    const data = await response.json()
    expect(data.summary).toBeDefined()
    expect(data.keyPoints).toBeInstanceOf(Array)
    expect(data.sentiment).toMatch(/positive|neutral|negative/)
  })
})
```

---

## Monitoring

### Key Metrics

Track these metrics for production:

1. **API Response Time** - Target: < 5 seconds
2. **Error Rate** - Target: < 1%
3. **Success Rate** - Target: > 99%
4. **Token Usage** - Monitor spend
5. **Model Accuracy** - Manual QA spot checks

### Setup Monitoring

```typescript
// In route.ts, add metrics
const startTime = Date.now()

// ... API call ...

const duration = Date.now() - startTime
console.log(`Email analysis took ${duration}ms`)

// Send to monitoring service
await analytics.track('email_analysis', {
  duration,
  success: true,
  sentiment: analysis.sentiment,
})
```

---

## Support & Resources

- **Claude API Docs**: https://docs.anthropic.com
- **API Reference**: https://docs.anthropic.com/en/api/messages
- **Models**: https://docs.anthropic.com/en/docs/about/models
- **Pricing**: https://www.anthropic.com/pricing
- **Status**: https://status.anthropic.com

---

## Summary

EXECOS Pro's Email Intel module provides **instant, AI-powered email analysis** using Claude 3.5 Sonnet. The integration is:

- ✓ Production-ready
- ✓ Fully typed (TypeScript)
- ✓ Error-handled
- ✓ Configurable
- ✓ Extensible

Start by:
1. Getting a Claude API key
2. Adding it to `.env.local`
3. Testing with the Email Intel UI
4. Extending with custom prompts as needed

---

*Last updated: June 2, 2026*
