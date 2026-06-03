# Agent 13 - Bulk Investigation API Routes

Complete API documentation for the bulk investigation system in EXECOS Pro.

## Overview

Five API routes handle the complete bulk investigation workflow:
1. **Upload** - Receive and parse files
2. **Analyze** - Process with Claude AI
3. **Status** - Monitor progress
4. **Results** - Retrieve findings
5. **Export** - Generate reports

---

## 1. Upload Files

### Endpoint
```
POST /api/investigations/bulk/upload
```

### Request
**Headers:**
```
Authorization: Bearer {user_token}
Content-Type: multipart/form-data
```

**Form Data:**
```
- files: File[] (required)
  - Supported types: .pdf, .docx, .txt, .eml, .msg
  - Max 100 files per upload
  - Max 50MB per file

- jobName: string (required)
  - Name for this investigation batch
```

### Response (200 OK)
```json
{
  "jobId": "uuid",
  "filesUploaded": 5,
  "ready_for_analysis": true,
  "errors": ["file1.txt: Unsupported file type"]
}
```

### Error Responses
- **400**: No files provided, invalid job name, or file too large
- **401**: Unauthorized
- **500**: Server error

### Features
- Automatic file type detection
- Text extraction from PDFs, DOCX, text, emails
- Metadata parsing (sender, recipient, dates for emails)
- File hash generation for duplicate detection
- Secure Supabase storage in `agent13-investigations` bucket
- RLS-enforced user isolation

---

## 2. Start Analysis

### Endpoint
```
POST /api/investigations/bulk/{jobId}/analyze
```

### Request
**Headers:**
```
Authorization: Bearer {user_token}
Content-Type: application/json
```

**Body (optional):**
```json
{
  "maxConcurrent": 5
}
```
- `maxConcurrent`: Number of files to analyze in parallel (1-20, default: 5)

### Response (200 OK)
```json
{
  "jobId": "uuid",
  "status": "complete",
  "filesProcessed": 5,
  "totalFiles": 5,
  "errors": ["file-id-3: Analysis failed"]
}
```

### Error Responses
- **400**: Invalid job, already analyzing, or no pending files
- **401**: Unauthorized
- **404**: Job not found
- **500**: Server error

### Features
- Parallel processing (5 concurrent by default)
- Claude 3.5 Sonnet integration
- Automatic text truncation (50K chars max)
- Generates:
  - Key findings
  - Risk score (1-100)
  - Risk level (low, medium, high)
  - Entities (people, organizations, locations)
  - Sentiment analysis
- Stores results in `investigation_summaries` table
- Updates file status to `analyzed` or `failed`

---

## 3. Check Job Status

### Endpoint
```
GET /api/investigations/bulk/{jobId}/status
```

### Request
**Headers:**
```
Authorization: Bearer {user_token}
```

### Response (200 OK)
```json
{
  "jobId": "uuid",
  "jobName": "Q2 2024 Document Review",
  "status": "analyzing",
  "totalFiles": 10,
  "processedFiles": 7,
  "percentComplete": 70,
  "startedAt": "2024-06-03T10:30:00Z",
  "fileStatuses": [
    {
      "fileId": "uuid",
      "filename": "document1.pdf",
      "status": "analyzed",
      "analyzedAt": "2024-06-03T10:35:00Z"
    },
    {
      "fileId": "uuid",
      "filename": "document2.pdf",
      "status": "failed",
      "error": "Analysis failed"
    }
  ]
}
```

### Error Responses
- **401**: Unauthorized
- **404**: Job not found
- **500**: Server error

### File Statuses
- `pending` - Awaiting analysis
- `analyzed` - Successfully analyzed
- `failed` - Analysis failed

### Job Statuses
- `pending` - Awaiting analysis to start
- `processing` - Files uploaded, ready
- `analyzing` - Analysis in progress
- `complete` - Analysis finished
- `failed` - Job failed

---

## 4. Get Results

### Endpoint
```
GET /api/investigations/bulk/{jobId}/results
```

### Request
**Headers:**
```
Authorization: Bearer {user_token}
```

### Response (200 OK)
```json
{
  "jobId": "uuid",
  "individual": [
    {
      "fileId": "uuid",
      "filename": "document1.pdf",
      "summary": {
        "key_findings": "Document discusses potential fraud scheme...",
        "risk_score": 78,
        "risk_level": "high",
        "entities_found": {
          "people": ["John Doe", "Jane Smith"],
          "organizations": ["Acme Corp"],
          "locations": ["New York", "London"]
        },
        "sentiment": "negative"
      }
    }
  ],
  "aggregate": {
    "aggregate_summary": "Comprehensive analysis of 5 documents...",
    "common_themes": ["fraud risk", "compliance issues"],
    "top_risks": ["unauthorized transactions", "record inconsistencies"],
    "all_entities": {
      "people": ["John Doe", "Jane Smith"],
      "organizations": ["Acme Corp", "XYZ Inc"]
    },
    "average_risk_score": 65,
    "sentiment_distribution": {
      "negative": 3,
      "neutral": 1,
      "positive": 1
    }
  },
  "risks": [
    {
      "risk_level": "low",
      "count": 2,
      "percentage": 40
    },
    {
      "risk_level": "medium",
      "count": 2,
      "percentage": 40
    },
    {
      "risk_level": "high",
      "count": 1,
      "percentage": 20
    }
  ],
  "entities": {
    "people": ["John Doe", "Jane Smith"],
    "organizations": ["Acme Corp", "XYZ Inc"],
    "locations": ["New York", "London"]
  }
}
```

### Features
- Individual file summaries
- Auto-generated aggregate summary (Claude AI)
- Risk distribution analysis
- Entity consolidation and deduplication
- Caches aggregate result for future requests

### Error Responses
- **401**: Unauthorized
- **404**: Job not found
- **500**: Server error

---

## 5. Export Results

### Endpoint
```
POST /api/investigations/bulk/{jobId}/export
```

### Request
**Headers:**
```
Authorization: Bearer {user_token}
Content-Type: application/json
```

**Body:**
```json
{
  "format": "json"
}
```
- `format`: `json`, `csv`, or `pdf`

### JSON Response
```json
{
  "success": true,
  "format": "json",
  "filename": "investigation_uuid.json",
  "data": {
    "jobId": "uuid",
    "jobName": "Investigation Name",
    "status": "complete",
    "metadata": {
      "totalFiles": 5,
      "processedFiles": 5,
      "createdAt": "2024-06-03T10:00:00Z"
    },
    "files": [
      {
        "filename": "document1.pdf",
        "fileType": "pdf",
        "fileSize": 250000,
        "status": "analyzed",
        "summary": {
          "key_findings": "...",
          "risk_score": 78
        }
      }
    ],
    "aggregate": { ... }
  }
}
```

### CSV Format
Comma-separated values with:
- Header information (job name, ID, status)
- Aggregate metrics (average risk score)
- File-level details (name, type, size, risk level, sentiment)

### PDF Format
HTML-formatted report with:
- Header section (job info, dates)
- Aggregate analysis (themes, risks, findings)
- Individual file analysis (table with key findings)

### Response Headers (CSV/PDF)
```
Content-Type: text/csv | text/html
Content-Disposition: attachment; filename="investigation_uuid.csv"
```

### Error Responses
- **400**: Invalid format
- **401**: Unauthorized
- **404**: Job not found
- **500**: Server error

---

## Authentication

All endpoints require authentication via Bearer token:

```bash
Authorization: Bearer {supabase_jwt_token}
```

Token obtained from Supabase authentication after user login.

---

## Database Schema

### bulk_investigations
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- job_name (text)
- status (enum: pending, processing, analyzing, complete, failed)
- total_files (integer)
- processed_files (integer)
- error_message (text, nullable)
- started_at (timestamp, nullable)
- completed_at (timestamp, nullable)
- created_at (timestamp)
```

### investigation_files
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- bulk_investigation_id (uuid, foreign key)
- original_filename (text)
- file_size (bigint)
- file_type (text)
- storage_path (text)
- extracted_text (text)
- parsed_metadata (jsonb)
- status (enum: pending, analyzed, failed)
- error (text, nullable)
- uploaded_at (timestamp)
- analyzed_at (timestamp, nullable)
```

### investigation_summaries
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- investigation_file_id (uuid, foreign key)
- key_findings (text)
- risk_score (integer, 1-100)
- risk_level (enum: low, medium, high)
- entities_found (jsonb)
- sentiment (enum: negative, neutral, positive)
- tokens_used (integer)
- created_at (timestamp)
```

### investigation_aggregates
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- bulk_investigation_id (uuid, foreign key)
- aggregate_summary (text)
- common_themes (text[])
- top_risks (text[])
- all_entities (jsonb)
- average_risk_score (numeric)
- sentiment_distribution (jsonb)
- created_at (timestamp)
```

---

## File Storage

**Bucket:** `agent13-investigations` (Supabase Storage)

**Path Format:** `{user_id}/{job_id}/{file_hash}-{filename}`

**Security:**
- RLS policies enforce user isolation
- Files are signed URLs for secure retrieval
- Service role key required for backend operations

---

## Error Handling

Standard error response format:
```json
{
  "error": "Error description"
}
```

HTTP Status Codes:
- **200** - Success
- **400** - Bad request (validation error)
- **401** - Unauthorized (missing/invalid token)
- **404** - Not found (resource doesn't exist)
- **500** - Server error

---

## Rate Limiting Notes

- Max 100 files per upload
- Max 20 concurrent analyses per job
- Claude API has standard rate limits
- Token management tracks usage via `tokens_used`

---

## Integration Example

### Complete Workflow
```typescript
// 1. Upload files
const uploadRes = await fetch('/api/investigations/bulk/upload', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData // FormData with files and jobName
})
const { jobId } = await uploadRes.json()

// 2. Start analysis
const analyzeRes = await fetch(
  `/api/investigations/bulk/${jobId}/analyze`,
  {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ maxConcurrent: 5 })
  }
)

// 3. Poll for status
let status = 'analyzing'
while (status === 'analyzing') {
  const statusRes = await fetch(
    `/api/investigations/bulk/${jobId}/status`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  )
  const data = await statusRes.json()
  status = data.status
  await new Promise(r => setTimeout(r, 1000))
}

// 4. Get results
const resultsRes = await fetch(
  `/api/investigations/bulk/${jobId}/results`,
  { headers: { 'Authorization': `Bearer ${token}` } }
)
const results = await resultsRes.json()

// 5. Export
const exportRes = await fetch(
  `/api/investigations/bulk/${jobId}/export`,
  {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ format: 'pdf' })
  }
)
```

---

## Implementation Notes

### File Parsing
- **PDF**: Extracts text using buffer operations (recommend `pdf-parse` library in production)
- **DOCX**: Extracts XML content from ZIP archive (recommend `mammoth` library in production)
- **TXT**: Direct text decoding
- **EML**: Extracts headers and body with regex patterns (recommend `email-parser` in production)
- **MSG**: Basic text extraction (recommend `msg-parser` in production)

### Claude Integration
- Model: `claude-3-5-sonnet-20241022`
- Max tokens: 2000 (for analysis)
- Text truncation: 50,000 characters per file
- Response parsing: JSON format with validation

### Parallel Processing
- Default: 5 concurrent files
- Maximum: 20 concurrent files
- Batch processing to prevent timeout
- Promise.all for parallel execution

### Performance Considerations
- File extraction can be CPU-intensive
- Claude API calls are network-dependent
- Large aggregates may take time to generate
- Consider implementing job queuing for high volume

---

## Security Considerations

1. **RLS Enforcement**: All queries use RLS policies
2. **Authentication**: Bearer token validation on all endpoints
3. **User Isolation**: Queries scoped to user_id
4. **File Validation**: Type checking, size limits, duplicate detection
5. **Input Sanitization**: All user inputs validated
6. **Token Management**: API keys in environment variables
7. **Storage Security**: Signed URLs, service role separation

---

## Future Enhancements

- Webhook notifications for job completion
- Batch job processing queue
- Real-time WebSocket updates
- Advanced entity linking and NLP
- Custom analysis templates
- Integration with external APIs
- OCR support for image files
- Advanced filtering and search

---

## Maintenance

### Database Indexes
All tables have indexes on:
- `user_id` (all tables)
- `status` (bulk_investigations, investigation_files)
- `created_at` (for sorting and cleanup)
- Foreign key relationships

### Cleanup Procedures
```sql
-- Delete old completed jobs (example: 30 days)
DELETE FROM bulk_investigations
WHERE user_id = $1 AND completed_at < NOW() - INTERVAL '30 days'
AND status = 'complete';
```

### Monitoring
Track:
- Average analysis time
- Claude API token usage
- Storage bucket size
- Error rates by file type
- Job success rates
