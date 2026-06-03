# EXECOS Pro: Email Export & Smart Actions System

Complete implementation of email investigation export and intelligent action suggestions.

## Features Overview

### Part 1: Email Export System
Export email investigations in 7 different formats with comprehensive analysis and metadata.

**Export Formats:**
- **PDF**: Professional formatted report with MedStar/Crothall branding
- **Word**: Fully editable .docx with sections and formatting
- **Text**: Plain text export
- **JSON**: Machine-readable structured data
- **CSV**: Spreadsheet-compatible for bulk analysis
- **Markdown**: Documentation-ready format
- **HTML**: Web-ready format

**Export Options:**
- Include/exclude full AI analysis
- Include/exclude response templates
- Include/exclude attachments
- Batch export multiple emails
- Thread export (entire conversation)

### Part 2: Smart Actions System
AI-driven action suggestions based on email analysis with one-click execution.

**Action Categories:**
1. **Response Options** (5 types)
   - Draft Firm Response
   - Draft Friendly Response
   - Draft Escalation Response
   - Draft Executive Summary
   - Generate Response Template

2. **Task Options** (3 types)
   - Create Task from Action Items
   - Create Single Task
   - Add to Existing Task

3. **Project/Site Options** (4 types)
   - Link to Project
   - Create Project from Email
   - Link to Site
   - Add to Existing Contract

4. **Contact Options** (3 types)
   - Add Contact
   - Update Vendor Profile
   - Flag Vendor Issue

5. **Documentation Options** (3 types)
   - Save to Memory
   - Create Note
   - Archive Email

6. **Compliance/Risk Options** (3 types)
   - Flag for Compliance Review
   - Escalate Risk
   - Create Policy Note

---

## Database Schema

### New Tables Created

#### 1. `email_exports`
Tracks all email exports with metadata and storage URLs.

```sql
CREATE TABLE public.email_exports (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  email_id UUID,  -- NULL for batch exports
  email_ids JSONB,  -- Array for batch
  
  export_format TEXT,  -- pdf, docx, txt, json, csv, md, html
  export_file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  
  include_attachments BOOLEAN,
  include_full_analysis BOOLEAN,
  include_response_template BOOLEAN,
  include_thread BOOLEAN,
  
  export_type TEXT,  -- single, batch, thread
  batch_count INTEGER,
  
  exported_by UUID,
  export_date TIMESTAMP,
  created_at TIMESTAMP
);
```

#### 2. `email_actions`
Records all actions executed on emails.

```sql
CREATE TABLE public.email_actions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  email_id UUID NOT NULL,
  
  action_type TEXT,  -- response, task, project, contact, etc.
  action_status TEXT,  -- pending, in_progress, completed, cancelled
  action_result JSONB,  -- What was created/modified
  action_summary TEXT,
  generated_content TEXT,  -- For drafts
  response_tone TEXT,  -- firm, friendly, escalation, etc.
  
  was_suggested BOOLEAN,
  suggestion_confidence INTEGER,
  
  suggested_at TIMESTAMP,
  executed_at TIMESTAMP,
  created_at TIMESTAMP
);
```

#### 3. `email_action_suggestions`
AI-generated suggestions for actions on emails.

```sql
CREATE TABLE public.email_action_suggestions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  email_id UUID NOT NULL,
  
  action_type TEXT,
  suggestion_text TEXT,
  reasoning TEXT,
  
  confidence_score INTEGER,  -- 0-100
  priority INTEGER,  -- 1-10 (1=highest)
  suggestion_group TEXT,  -- response_options, task_options, etc.
  
  dismissed BOOLEAN,
  dismissed_at TIMESTAMP,
  executed BOOLEAN,
  executed_at TIMESTAMP,
  
  created_at TIMESTAMP
);
```

#### 4. `email_response_templates`
Reusable response templates created by users.

```sql
CREATE TABLE public.email_response_templates (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  
  template_name TEXT,
  template_description TEXT,
  template_category TEXT,  -- firm, friendly, escalation, etc.
  template_text TEXT,
  template_variables JSONB,  -- {{senderName}}, {{actionItem}}, etc.
  
  usage_count INTEGER,
  last_used_at TIMESTAMP,
  
  created_at TIMESTAMP
);
```

#### 5. `batch_export_jobs`
Tracks batch export jobs and progress.

```sql
CREATE TABLE public.batch_export_jobs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  
  job_name TEXT,
  email_ids JSONB,
  export_format TEXT,
  
  include_attachments BOOLEAN,
  include_full_analysis BOOLEAN,
  include_response_template BOOLEAN,
  separate_files BOOLEAN,
  
  status TEXT,  -- pending, processing, completed, failed
  progress_percent INTEGER,
  
  output_file_url TEXT,
  output_file_size INTEGER,
  error_message TEXT,
  
  total_emails INTEGER,
  completed_at TIMESTAMP,
  created_at TIMESTAMP
);
```

---

## API Routes

### Export APIs

#### `POST /api/emails/export`
Export a single email investigation.

**Request:**
```json
{
  "emailId": "uuid",
  "format": "pdf|docx|txt|json|csv|md|html",
  "includeAttachments": false,
  "includeFullAnalysis": true,
  "includeResponseTemplate": true,
  "exportName": "optional-name"
}
```

**Response:**
```json
{
  "success": true,
  "exportId": "uuid",
  "fileName": "email-subject-123456.pdf",
  "fileUrl": "https://...",
  "format": "pdf",
  "size": 45320
}
```

#### `POST /api/emails/export-batch`
Export multiple emails with optional zip file.

**Request:**
```json
{
  "emailIds": ["uuid1", "uuid2", "uuid3"],
  "format": "pdf|docx|txt|json|csv|md|html",
  "includeAttachments": false,
  "includeFullAnalysis": true,
  "includeResponseTemplate": true,
  "separateFiles": false,
  "jobName": "optional-name"
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "uuid",
  "fileUrl": "https://...",
  "fileName": "batch-export-abc123.zip",
  "emailCount": 3,
  "status": "completed"
}
```

#### `GET /api/emails/export-batch?jobId=uuid`
Check batch export job status.

**Response:**
```json
{
  "jobId": "uuid",
  "status": "processing|completed|failed",
  "progress": 75,
  "emailCount": 3,
  "fileUrl": "https://...",
  "fileName": "batch-export.zip",
  "completedAt": "2024-06-02T23:05:00Z",
  "errorMessage": null
}
```

#### `DELETE /api/emails/exports/[id]`
Delete an export and its file.

---

### Action APIs

#### `POST /api/emails/suggest-actions`
Get AI-suggested actions for an email.

**Request:**
```json
{
  "emailId": "uuid",
  "siteId": "uuid"
}
```

**Response:**
```json
{
  "emailId": "uuid",
  "suggestions": [
    {
      "action_type": "draft_firm_response",
      "suggestion_text": "Draft firm response to demand for immediate payment",
      "reasoning": "Email is demanding and unresponsive to previous requests",
      "confidence_score": 92,
      "priority": 1,
      "suggestion_group": "response_options"
    },
    {
      "action_type": "create_task",
      "suggestion_text": "Create task to follow up on payment status",
      "reasoning": "Deadline mentioned with 5-day urgency",
      "confidence_score": 88,
      "priority": 2,
      "suggestion_group": "task_options"
    }
  ],
  "groupedSuggestions": {
    "response_options": [...],
    "task_options": [...],
    "project_options": [...]
  },
  "primarySuggestion": {...},
  "totalSuggestions": 6,
  "riskLevel": "red",
  "requiresResponse": true,
  "hasDeadline": true
}
```

#### `GET /api/emails/[id]/suggest-actions?emailId=uuid`
Retrieve existing suggestions for an email (non-dismissed).

#### `POST /api/emails/execute-action`
Execute a smart action suggestion.

**Request:**
```json
{
  "emailId": "uuid",
  "actionType": "draft_firm_response|create_task|add_contact|...",
  "siteId": "uuid",
  "additionalParams": {
    "projectId": "uuid"  // Optional, depends on action type
  }
}
```

**Response:**
```json
{
  "success": true,
  "actionType": "draft_firm_response",
  "actionId": "uuid",
  "actionSummary": "Generated firm, professional response",
  "result": {
    "content": "Full response text..."
  },
  "generatedContent": "Full response text..."
}
```

**Supported Action Types:**
- `draft_firm_response` - Returns generated response
- `draft_friendly_response` - Returns generated response
- `draft_escalation` - Returns generated response
- `draft_executive_summary` - Returns generated response
- `create_task` - Returns task ID
- `create_multiple_tasks` - Returns task count and IDs
- `add_contact` - Returns contact ID
- `link_project` - Returns project ID
- `create_project` - Returns new project ID
- `schedule_followup` - Returns follow-up task ID
- `save_memory` - Returns memory ID
- `flag_compliance` - Returns compliance task ID
- `escalate_risk` - Returns escalation task ID
- `archive` - Returns confirmation

#### `POST /api/emails/batch/execute-actions`
Execute actions on multiple emails.

**Request:**
```json
{
  "emailIds": ["uuid1", "uuid2"],
  "actionType": "archive|create_task|flag_compliance",
  "siteId": "uuid"
}
```

---

## UI Components

### 1. EmailExportDialog
Standalone export dialog component.

**Props:**
```typescript
interface EmailExportDialogProps {
  emailId: string
  emailSubject: string
  isOpen: boolean
  onClose: () => void
  onExportComplete?: (result: any) => void
}
```

**Usage:**
```tsx
const [isExportOpen, setIsExportOpen] = useState(false)

<EmailExportDialog
  emailId={email.id}
  emailSubject={email.subject}
  isOpen={isExportOpen}
  onClose={() => setIsExportOpen(false)}
  onExportComplete={(result) => console.log('Exported:', result)}
/>

<button onClick={() => setIsExportOpen(true)}>
  Export Email
</button>
```

### 2. SmartActionsPanel
Display AI-suggested actions grouped by category.

**Props:**
```typescript
interface SmartActionsPanelProps {
  emailId: string
  siteId: string
  riskLevel: 'green' | 'yellow' | 'red'
  onActionExecuted?: (actionType: string, result: any) => void
}
```

**Usage:**
```tsx
<SmartActionsPanel
  emailId={email.id}
  siteId={site.id}
  riskLevel={analysis.risk_level}
  onActionExecuted={(actionType, result) => {
    console.log(`Executed: ${actionType}`, result)
    // Refresh email or update UI
  }}
/>
```

### 3. Quick Action Buttons
Add to email detail view for fast actions.

```tsx
<div className="flex gap-2">
  <button className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700">
    Draft Response
  </button>
  <button className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700">
    Create Task
  </button>
  <button className="px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700">
    Link Project
  </button>
  <button onClick={() => setIsExportOpen(true)} className="px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700">
    Export
  </button>
</div>
```

---

## Implementation Checklist

- [ ] Run `database_email_exports.sql` to create tables
- [ ] Copy API route files to `/src/app/api/`
- [ ] Copy UI components to `/src/components/`
- [ ] Add export/action buttons to email detail view
- [ ] Integrate SmartActionsPanel to email analysis view
- [ ] Update package.json with dependencies:
  - jspdf
  - docx
  - jszip
- [ ] Update Supabase storage buckets:
  - Create `email-exports` bucket
  - Create `batch-exports` bucket
- [ ] Test export functionality with all formats
- [ ] Test action execution (drafts, tasks, contacts)
- [ ] Configure email response templates (optional)
- [ ] Set up completion notifications

---

## Key Features

### Smart Suggestion Algorithm
Actions are suggested based on:
- **Email content** - Intent, request, tone
- **Risk level** - Red triggers escalation prompts
- **Deadlines** - Mentioned dates trigger task creation
- **Sender patterns** - Known vendor behavior
- **Related items** - Auto-match to projects/contracts
- **Email type** - Question, request, alert, FYI
- **Urgency** - Explicit and implicit urgency signals

### Export Quality
Each export format is optimized:
- **PDF**: Professional branding, colors, pagination
- **Word**: Full editability, sections, tables, comments
- **CSV**: Bulk import to Excel/Sheets for tracking
- **JSON**: Machine-readable for integrations
- **Markdown**: Documentation and knowledge base
- **HTML**: Web-ready with styling

### Action Execution
All actions are:
- **Recorded** in database for audit trail
- **Linked** to original email for context
- **Trackable** with status and timestamps
- **Reversible** (archive can be undone)
- **Suggested** based on AI analysis

---

## Error Handling

All APIs include:
- Validation of required fields
- User authorization checks
- Graceful error messages
- Logging for debugging
- Retry mechanisms for exports

---

## Security Considerations

- RLS policies enforce user isolation
- Exports stored in Supabase Storage (authenticated URLs)
- Actions audit-logged with user tracking
- Rate limiting recommended on export APIs
- Sensitive content should be marked in suggestions

---

## Performance Optimization

- Batch exports use zip streaming
- Suggestions cached for 1 hour
- Action execution is async
- Database indexes on common queries
- Progressive loading for large email batches

---

## Future Enhancements

1. **AI Response Refinement** - User feedback on generated responses
2. **Template Library** - Pre-built response templates by industry
3. **Workflow Automation** - Chain multiple actions
4. **Integration** - Salesforce, HubSpot CRM linkage
5. **Analytics** - Export and action usage metrics
6. **Custom Actions** - User-defined action types

---

## File Structure

```
execos-pro/
├── database_email_exports.sql
├── src/
│   ├── app/api/
│   │   └── emails/
│   │       ├── export/
│   │       │   └── route.ts
│   │       ├── export-batch/
│   │       │   └── route.ts
│   │       ├── suggest-actions/
│   │       │   └── route.ts
│   │       └── execute-action/
│   │           └── route.ts
│   └── components/
│       ├── EmailExportDialog.tsx
│       └── SmartActionsPanel.tsx
└── EMAIL_EXPORT_AND_ACTIONS.md (this file)
```

---

## Support

For issues or questions:
1. Check the implementation checklist
2. Review API error messages
3. Check database RLS policies
4. Verify Supabase Storage buckets exist
5. Test with sample email data

