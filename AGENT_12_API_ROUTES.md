# Agent 12: Data Synthesis API Routes Documentation

## Overview
Agent 12 provides 4 API routes for data synthesis, archival, and AI-powered Q&A. These routes aggregate emails, contracts, and calendar events into executive summaries, store them in Supabase, and enable interactive questioning about the synthesized content.

---

## Routes

### 1. POST `/api/synthesis/generate`
**Purpose:** Manually trigger synthesis generation and compress data into a 10-page executive summary

#### Request
```json
{
  "startDate": "2026-05-24T00:00:00Z",  // Optional, defaults to 7 days ago
  "endDate": "2026-06-03T23:59:59Z"      // Optional, defaults to now
}
```

#### Response (201 Created)
```json
{
  "synthesisId": "uuid-string",
  "jobStatus": "completed",
  "tokensUsed": {
    "input": 5432,
    "output": 2876,
    "total": 8308
  },
  "dataProcessed": {
    "emails": 42,
    "contracts": 3,
    "events": 8
  }
}
```

#### Error Cases
| Status | Error | Cause |
|--------|-------|-------|
| 400 | No data found | No emails, contracts, or events in date range |
| 401 | Unauthorized | Missing or invalid auth token |
| 500 | Failed to store synthesis | Database insertion error |
| 503 | AI service error | Claude API failure |

#### Features
- **Data Aggregation:** Fetches emails, contracts, and calendar events for the specified date range
- **Token Management:** Tracks input/output tokens used by Claude
- **Executive Formatting:** Structures synthesis into 8 sections:
  - Executive Overview
  - Key Decisions & Actions
  - Contracts & Agreements
  - Calendar & Timeline
  - Stakeholders & Roles
  - Risk Assessment
  - Emerging Patterns
  - Recommendations

#### Implementation Details
- Uses Supabase RLS policies to enforce user isolation
- Service role key used for secure database operations
- Claude 3.5 Sonnet model (claude-3-5-sonnet-20241022)
- Max output: 4000 tokens per synthesis
- Stores synthesis metadata: source counts, token usage, timestamps

---

### 2. POST `/api/synthesis/query`
**Purpose:** Ask questions about a specific synthesis, powered by Claude AI

#### Request
```json
{
  "synthesisId": "uuid-string",
  "question": "What are the key risks identified in this week's synthesis?"
}
```

#### Response (200 OK)
```json
{
  "answer": "Based on the synthesis, the key risks include...",
  "tokensUsed": {
    "input": 3456,
    "output": 892,
    "total": 4348
  },
  "queryId": "uuid-string"
}
```

#### Error Cases
| Status | Error | Cause |
|--------|-------|-------|
| 400 | Missing required fields | synthesisId or question not provided |
| 400 | Question is too long | Question exceeds 2000 characters |
| 401 | Unauthorized | Missing or invalid auth token |
| 404 | Synthesis not found | Synthesis ID invalid or access denied |
| 503 | AI service error | Claude API failure |

#### Features
- **Context-Aware Answering:** Claude references the full synthesis content
- **Source Citations:** Responses reference specific synthesis sections
- **Query Persistence:** All Q&A stored in `synthesis_queries` table for history
- **Token Tracking:** Monitors API usage for cost management
- **Validation:** Prevents empty or excessively long questions

#### Implementation Details
- Uses Claude 3.5 Sonnet model
- Max output: 1500 tokens per answer
- System prompt guides Claude to cite sources and handle out-of-synthesis questions
- Graceful storage failure: returns answer even if database insertion fails

---

### 3. GET `/api/synthesis/timeline`
**Purpose:** Retrieve historical list of all syntheses with metadata and optional filtering

#### Query Parameters
| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| startDate | ISO 8601 | - | - | Filter syntheses from this date |
| endDate | ISO 8601 | - | - | Filter syntheses until this date |
| limit | integer | 50 | 100 | Max results to return |

#### Example
```
GET /api/synthesis/timeline?startDate=2026-05-01&endDate=2026-06-01&limit=20
```

#### Response (200 OK)
```json
{
  "items": [
    {
      "id": "uuid-string",
      "week_start": "2026-05-26T00:00:00Z",
      "week_end": "2026-06-01T23:59:59Z",
      "created_at": "2026-06-02T14:32:10Z",
      "summary_preview": "Executive overview of the week's activities, key decisions made, and identified risks...",
      "page_reduction": 4200,
      "source_email_count": 42,
      "source_contract_count": 3,
      "source_event_count": 8
    }
  ],
  "count": 1,
  "period": {
    "startDate": "2026-05-01",
    "endDate": "2026-06-01"
  }
}
```

#### Error Cases
| Status | Error | Cause |
|--------|-------|-------|
| 400 | Invalid date format | startDate or endDate not ISO 8601 |
| 401 | Unauthorized | Missing or invalid auth token |
| 500 | Failed to retrieve timeline | Database query error |

#### Features
- **Date Range Filtering:** Optional start/end dates for historical browsing
- **Pagination:** Limits results to reduce payload
- **Summary Preview:** First 200 characters of synthesis for quick scanning
- **Metadata Display:** Shows source data counts and page reduction metrics
- **Chronological Ordering:** Most recent syntheses first

#### Implementation Details
- Returns syntheses ordered by `week_start` descending
- `page_reduction` calculated as: `(source_count / 10) * 100`
- Date validation uses ISO 8601 format checking
- Max limit enforced at 100 items to prevent large transfers

---

### 4. GET `/api/synthesis/[id]`
**Purpose:** Retrieve complete synthesis details with optional query history

#### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| id | UUID | Synthesis ID to retrieve |

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| includeQueries | boolean | false | Include all Q&A history for this synthesis |

#### Example
```
GET /api/synthesis/abc123?includeQueries=true
```

#### Response (200 OK - Without Queries)
```json
{
  "id": "uuid-string",
  "week_start": "2026-05-26T00:00:00Z",
  "week_end": "2026-06-01T23:59:59Z",
  "created_at": "2026-06-02T14:32:10Z",
  "content": "EXECUTIVE SYNTHESIS...[full 10-page content]",
  "source_email_count": 42,
  "source_contract_count": 3,
  "source_event_count": 8,
  "estimated_pages": 10,
  "input_tokens": 5432,
  "output_tokens": 2876
}
```

#### Response (200 OK - With Queries)
```json
{
  "id": "uuid-string",
  "week_start": "2026-05-26T00:00:00Z",
  "week_end": "2026-06-01T23:59:59Z",
  "created_at": "2026-06-02T14:32:10Z",
  "content": "EXECUTIVE SYNTHESIS...[full 10-page content]",
  "source_email_count": 42,
  "source_contract_count": 3,
  "source_event_count": 8,
  "estimated_pages": 10,
  "input_tokens": 5432,
  "output_tokens": 2876,
  "queries": [
    {
      "id": "query-uuid",
      "question": "What are the key risks?",
      "answer": "The key risks identified include...",
      "created_at": "2026-06-02T15:10:45Z"
    }
  ]
}
```

#### Error Cases
| Status | Error | Cause |
|--------|-------|-------|
| 400 | Invalid synthesis ID | Empty or malformed ID |
| 401 | Unauthorized | Missing or invalid auth token |
| 404 | Not found | Synthesis ID invalid or access denied |
| 500 | Internal server error | Database query error |

#### Features
- **Full Content Retrieval:** Returns complete synthesis text
- **Complete Metadata:** All token counts and source statistics
- **Optional Query History:** Can include all Q&A for this synthesis
- **RLS Enforcement:** User can only access their own syntheses

#### Implementation Details
- Uses `.single()` to ensure exactly one match
- Handles PGRST116 error code (no rows returned) gracefully
- Optional query loading ordered by `created_at` descending
- Efficient: only loads queries if requested

---

## Authentication

All routes require Bearer token authentication:
```
Authorization: Bearer <supabase_jwt_token>
```

Token is verified using Supabase's `getUser()` method with service role key. Requests without valid tokens receive 401 Unauthorized responses.

---

## Database Tables

### synthesis_archives
Stores compressed executive summaries.

```sql
CREATE TABLE synthesis_archives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  week_start TIMESTAMP WITH TIME ZONE NOT NULL,
  week_end TIMESTAMP WITH TIME ZONE NOT NULL,
  content TEXT NOT NULL,
  source_email_count INTEGER DEFAULT 0,
  source_contract_count INTEGER DEFAULT 0,
  source_event_count INTEGER DEFAULT 0,
  estimated_pages INTEGER DEFAULT 10,
  input_tokens INTEGER,
  output_tokens INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_synthesis_user_week 
  ON synthesis_archives(user_id, week_start DESC);
```

### synthesis_queries
Tracks all Q&A interactions with syntheses.

```sql
CREATE TABLE synthesis_queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  synthesis_id UUID NOT NULL REFERENCES synthesis_archives(id),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_synthesis_queries_lookup 
  ON synthesis_queries(synthesis_id, user_id);
```

### RLS Policies
All tables require RLS policies:
```sql
-- synthesis_archives RLS
ALTER TABLE synthesis_archives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own syntheses"
  ON synthesis_archives FOR ALL
  USING (auth.uid() = user_id);

-- synthesis_queries RLS
ALTER TABLE synthesis_queries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own queries"
  ON synthesis_queries FOR ALL
  USING (auth.uid() = user_id);
```

---

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Error Handling

All routes implement:
- **Input Validation:** Length checks, format validation, required field checks
- **Auth Verification:** Bearer token validation via Supabase
- **Database Error Handling:** Graceful failures with user-friendly messages
- **API Error Handling:** Claude API failures with 503 status codes
- **Logging:** Console error logs for debugging

---

## Token Management

Each synthesis and query tracks token usage:
- **Input Tokens:** Cost of sending the synthesis to Claude
- **Output Tokens:** Cost of Claude's response
- **Total:** Combined for cost tracking

Use token counts to:
- Monitor API costs
- Optimize prompt engineering
- Cap synthesis generation (if needed)
- Implement rate limiting

---

## Performance Considerations

- **Synthesis Generation:** ~10-15 seconds (network + Claude latency)
- **Query Processing:** ~5-8 seconds per question
- **Timeline Retrieval:** <500ms for typical user (50 syntheses)
- **Detail Retrieval:** <100ms without queries, ~500ms with full history

---

## Usage Examples

### Generate Synthesis
```bash
curl -X POST http://localhost:3000/api/synthesis/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2026-05-26T00:00:00Z",
    "endDate": "2026-06-02T23:59:59Z"
  }'
```

### Ask Question
```bash
curl -X POST http://localhost:3000/api/synthesis/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "synthesisId": "abc-123-def",
    "question": "What contracts need renewal?"
  }'
```

### Get Timeline
```bash
curl http://localhost:3000/api/synthesis/timeline?limit=10 \
  -H "Authorization: Bearer $TOKEN"
```

### Retrieve Synthesis with History
```bash
curl 'http://localhost:3000/api/synthesis/abc-123-def?includeQueries=true' \
  -H "Authorization: Bearer $TOKEN"
```

---

## Future Enhancements

- **Scheduled Synthesis:** Cron job for automatic Friday generation
- **Synthesis Comparison:** Compare two syntheses to identify changes
- **Collaborative Comments:** Add notes/comments to syntheses
- **Export Options:** PDF/JSON/CSV export of syntheses
- **Real-time Updates:** WebSocket support for live synthesis progress
- **Advanced Filtering:** Filter by risk level, stakeholder, contract type
