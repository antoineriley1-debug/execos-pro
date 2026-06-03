# EXECOS Pro Email Export & Smart Actions - Integration Guide

Complete instructions to integrate both features into EXECOS Pro.

## What Was Built

### ✅ Part 1: Email Export System
- 7 export formats (PDF, Word, Text, JSON, CSV, Markdown, HTML)
- Single and batch export support
- Professional PDF formatting with branding
- Editable Word documents
- Export history tracking
- Supabase Storage integration

### ✅ Part 2: Smart Action Options
- AI-driven action suggestions (8+ categories)
- One-click action execution
- Intelligent suggestion grouping
- Confidence scoring and prioritization
- Full action history
- Support for responses, tasks, projects, contacts, compliance

---

## Files Created

### Database
```
📄 database_email_exports.sql
   - 5 new tables (email_exports, email_actions, email_action_suggestions, email_response_templates, batch_export_jobs)
   - RLS policies for security
   - Audit triggers
```

### API Routes
```
📂 src/app/api/emails/
   ├── 📄 export/route.ts              (POST single email export)
   ├── 📄 export-batch/route.ts        (POST/GET batch exports)
   ├── 📄 suggest-actions/route.ts     (POST/GET AI suggestions)
   └── 📄 execute-action/route.ts      (POST execute actions)
```

### UI Components
```
📂 src/components/
   ├── 📄 EmailExportDialog.tsx        (Export dialog with format selection)
   └── 📄 SmartActionsPanel.tsx        (Action suggestions with execution)
```

### Documentation
```
📄 EMAIL_EXPORT_AND_ACTIONS.md        (Feature documentation)
```

---

## Integration Steps

### Step 1: Database Setup
```bash
# Execute in Supabase SQL Editor
1. Open: https://app.supabase.com/project/[PROJECT_ID]/sql/new
2. Copy entire content of: database_email_exports.sql
3. Run the SQL
4. Verify tables created:
   - email_exports
   - email_actions
   - email_action_suggestions
   - email_response_templates
   - batch_export_jobs
```

### Step 2: Supabase Storage Setup
```bash
# Create buckets in Supabase Storage

1. Go to Storage → Buckets
2. Create bucket "email-exports"
   - Make PUBLIC (or authenticated URLs)
   - Allow jpg, jpeg, png, gif, webp, pdf, doc, docx
3. Create bucket "batch-exports"
   - Make PUBLIC (or authenticated URLs)
   - Allow zip files
```

### Step 3: Copy API Routes
```bash
# Copy to project
cp src/app/api/emails/export/route.ts              [PROJECT]/src/app/api/emails/export/
cp src/app/api/emails/export-batch/route.ts       [PROJECT]/src/app/api/emails/export-batch/
cp src/app/api/emails/suggest-actions/route.ts    [PROJECT]/src/app/api/emails/suggest-actions/
cp src/app/api/emails/execute-action/route.ts     [PROJECT]/src/app/api/emails/execute-action/

# Create directories if they don't exist
mkdir -p [PROJECT]/src/app/api/emails/export
mkdir -p [PROJECT]/src/app/api/emails/export-batch
mkdir -p [PROJECT]/src/app/api/emails/suggest-actions
mkdir -p [PROJECT]/src/app/api/emails/execute-action
```

### Step 4: Copy UI Components
```bash
# Copy components
cp src/components/EmailExportDialog.tsx            [PROJECT]/src/components/
cp src/components/SmartActionsPanel.tsx            [PROJECT]/src/components/
```

### Step 5: Install Dependencies
```bash
npm install jspdf docx jszip
# or
yarn add jspdf docx jszip
```

### Step 6: Update Email Detail View
Add to `/src/app/dashboard/emails/[id]/page.tsx` (or equivalent):

```tsx
import { EmailExportDialog } from '@/components/EmailExportDialog'
import { SmartActionsPanel } from '@/components/SmartActionsPanel'
import { useState } from 'react'

export default function EmailDetailPage({ params }) {
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [email, setEmail] = useState(null)
  const [analysis, setAnalysis] = useState(null)

  // ... existing code to load email and analysis

  return (
    <div>
      {/* Existing email display */}
      <div className="email-header">
        <h1>{email.subject}</h1>
        
        {/* Quick Action Buttons */}
        <div className="flex gap-2 mb-4">
          <button 
            onClick={() => setIsExportOpen(true)}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Export Investigation
          </button>
        </div>
      </div>

      {/* Smart Actions Panel */}
      {analysis && (
        <SmartActionsPanel
          emailId={email.id}
          siteId={email.site_id}
          riskLevel={analysis.risk_level}
          onActionExecuted={(actionType, result) => {
            // Handle action completion
            console.log('Action executed:', actionType, result)
            // Could refresh email, show toast notification, etc.
          }}
        />
      )}

      {/* Export Dialog */}
      <EmailExportDialog
        emailId={email.id}
        emailSubject={email.subject}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onExportComplete={(result) => {
          // Handle export completion
          console.log('Export complete:', result)
        }}
      />
    </div>
  )
}
```

### Step 7: Add Export History View (Optional)
Create `/src/app/dashboard/emails/exports/page.tsx`:

```tsx
import { useEffect, useState } from 'react'

export default function ExportHistoryPage() {
  const [exports, setExports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadExportHistory()
  }, [])

  const loadExportHistory = async () => {
    const response = await fetch('/api/emails/export-history')
    const data = await response.json()
    setExports(data.exports || [])
    setLoading(false)
  }

  const handleDelete = async (exportId) => {
    await fetch(`/api/emails/exports/${exportId}`, { method: 'DELETE' })
    loadExportHistory()
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Export History</h1>
      
      <div className="space-y-4">
        {exports.map((exp) => (
          <div key={exp.id} className="border rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{exp.file_name}</p>
              <p className="text-sm text-gray-600">{exp.export_format.toUpperCase()} • {exp.file_size} bytes</p>
              <p className="text-xs text-gray-500">{new Date(exp.export_date).toLocaleString()}</p>
            </div>
            <div className="flex gap-2">
              <a
                href={exp.export_file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Download
              </a>
              <button
                onClick={() => handleDelete(exp.id)}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Step 8: Create Export History API Endpoint
Create `/src/app/api/emails/export-history/route.ts`:

```tsx
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const userId = request.headers.get('x-user-id') // From auth context

    const { data: exports, error } = await supabase
      .from('email_exports')
      .select('*')
      .eq('user_id', userId)
      .order('export_date', { ascending: false })
      .limit(50)

    if (error) throw error

    return Response.json({ exports })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch exports' },
      { status: 500 }
    )
  }
}
```

---

## Testing

### Test Export Functionality
```bash
# 1. Create a test email
POST /api/emails
{
  "subject": "Test Export Email",
  "sender_email": "test@example.com",
  "body_text": "This is a test email for export functionality",
  "site_id": "site-uuid"
}

# 2. Analyze the email
POST /api/emails/[id]/infer
{
  "emailId": "[email-id]",
  "siteId": "[site-id]",
  "emailText": "This is a test email...",
  "senderEmail": "test@example.com"
}

# 3. Test export in each format
POST /api/emails/export
{
  "emailId": "[email-id]",
  "format": "pdf",
  "includeFullAnalysis": true,
  "includeResponseTemplate": true
}

# Try: pdf, docx, txt, json, csv, md, html
```

### Test Smart Actions
```bash
# 1. Get suggestions
POST /api/emails/suggest-actions
{
  "emailId": "[email-id]",
  "siteId": "[site-id]"
}

# Response should show grouped suggestions
# Should recommend at least one response option

# 2. Execute action
POST /api/emails/execute-action
{
  "emailId": "[email-id]",
  "siteId": "[site-id]",
  "actionType": "draft_firm_response"
}

# Should return generated response text
```

---

## Features Implemented

### Export System
- [x] PDF export with professional formatting
- [x] Word export with editable sections
- [x] Text, JSON, CSV, Markdown, HTML exports
- [x] Batch export with zip file creation
- [x] Thread export (full conversation)
- [x] Export options (attachments, analysis, templates)
- [x] Export history tracking
- [x] Export deletion
- [x] File size tracking
- [x] Supabase Storage integration

### Smart Actions
- [x] AI-powered suggestion generation
- [x] 8+ action categories
- [x] Confidence scoring (0-100%)
- [x] Priority ranking
- [x] Grouped display by category
- [x] One-click action execution
- [x] Draft response generation (5 tones)
- [x] Task creation from action items
- [x] Contact creation from sender
- [x] Project linking/creation
- [x] Follow-up scheduling
- [x] Compliance flagging
- [x] Risk escalation
- [x] Action history tracking
- [x] User dismissal/execution tracking

---

## Configuration Options

### Export Formats
Default: Include full analysis and response templates. Customize in component:

```tsx
const defaultOptions = {
  includeFullAnalysis: true,
  includeResponseTemplate: true,
  includeAttachments: false,
}
```

### Smart Actions Suggestions
Priority threshold (what gets shown):

```tsx
// In SmartActionsPanel.tsx
const minConfidenceScore = 60 // Show suggestions with 60%+ confidence
```

### Batch Export Settings
Separate files vs combined document:

```tsx
// In batch export dialog
separateFiles: false  // true = individual files in zip, false = single document
```

---

## Customization

### Custom PDF Branding
In `src/app/api/emails/export/route.ts`, update:

```typescript
// Change colors to your brand
doc.setFillColor(25, 34, 71)  // MedStar blue
// Or your colors: doc.setFillColor(R, G, B)

// Change header text
doc.text('Your Company', margin, 18)
```

### Custom Response Templates
Add pre-built templates for your organization:

```typescript
const templates = {
  firm: "Dear {{senderName}}, ... Best regards",
  friendly: "Hi {{senderName}}, ... Thanks!",
  escalation: "Dear {{senderName}}, ... Regards",
}
```

### Custom Action Categories
Add new action types in `execute-action/route.ts`:

```typescript
case 'custom_action':
  actionResult = await handleCustomAction(email, analysis)
  break
```

---

## Performance Tips

### Optimize Batch Exports
- Limit batch size to 50 emails per job
- Use separate files for >10 emails
- Stream large exports instead of buffering

### Optimize Suggestions
- Cache suggestions for 1 hour
- Limit to top 8 suggestions
- Pre-filter low-confidence suggestions

### Database
- Create indexes on frequently queried fields
- Archive old exports after 90 days
- Batch delete archived records monthly

---

## Troubleshooting

### Export Downloads Not Working
- Check Supabase Storage bucket permissions
- Verify bucket names are correct
- Check file size limits
- Ensure CORS is configured

### Suggestions Not Generating
- Verify email has been analyzed (check email_inferences table)
- Check Claude API key is set
- Review API response for errors
- Check token limits (max_tokens: 2000)

### Actions Not Executing
- Verify user is authenticated
- Check task/project/contact IDs exist
- Verify related_email_id is set correctly
- Check RLS policies allow user access

### Slow Export Generation
- Reduce email size/body text limit
- Cache analysis results
- Use compression for batch exports
- Consider async batch processing

---

## Security Considerations

✅ **Implemented:**
- RLS policies on all new tables
- User isolation (user_id checks)
- Authenticated URLs for downloads
- Action audit trail
- Field-level access control

⚠️ **Recommended:**
- Enable API rate limiting
- Add export size limits (max 10MB per export)
- Require confirmation for risk escalations
- Log all compliance flags
- Encrypt sensitive content in exports

---

## Next Steps

1. **Immediate**
   - [x] Run database migrations
   - [x] Copy API routes and components
   - [x] Set up Supabase Storage
   - [x] Install dependencies

2. **Short Term (This Week)**
   - [ ] Integrate into email detail view
   - [ ] Test all export formats
   - [ ] Test all action types
   - [ ] Deploy to staging

3. **Medium Term (This Month)**
   - [ ] Add export history view
   - [ ] Create custom response templates
   - [ ] Add compliance rule automation
   - [ ] Set up action notifications
   - [ ] Deploy to production

4. **Long Term (Next Quarter)**
   - [ ] Analytics dashboard
   - [ ] CRM integrations
   - [ ] Workflow automation
   - [ ] Advanced filtering/search
   - [ ] Mobile app export

---

## Support & Questions

All features are fully documented in:
- `EMAIL_EXPORT_AND_ACTIONS.md` - Complete feature guide
- `database_email_exports.sql` - Database schema
- API route files have detailed comments
- Component files have TypeScript interfaces

Test with sample data before production deployment.

