# EXECOS Pro Intelligence Systems - Complete Implementation Guide

## Overview

This guide documents the four interconnected intelligence systems built for EXECOS Pro:

1. **Email Inference Engine** — Advanced email analysis with 13 inference points
2. **Sender/Receiver Learning System** — Contact profiles and pattern recognition
3. **Calendar Intelligence System** — Unified calendar with AI-powered event management
4. **Workflow Intelligence & Command Center** — Dashboard with AI recommendations

## Files Created

### Database

- **`database_extensions.sql`** — Complete SQL schema for all 8 new tables
  - `email_inferences` — 13-point email analysis storage
  - `contact_profiles` — Contact communication patterns
  - `sender_patterns` — Pattern detection and statistics
  - `calendar_events` — Full event management
  - `calendar_reminders` — Reminder tracking
  - `recurring_tasks` — Recurring pattern definitions
  - `workflow_patterns` — Learned workflow patterns
  - `workflow_recommendations` — AI recommendations
  - `ai_observations` — Anomalies, patterns, insights

### API Endpoints

#### Email Inference
- **`src/app/api/email/infer/route.ts`**
  - `POST /api/email/infer` — Analyze email and generate 13-point inference
  - Uses Claude 3.5 Sonnet for deep analysis
  - Returns inference with confidence score (0-100%)
  - Integrates with contact profiles for pattern matching
  - Auto-updates sender reliability tracking

#### Contact Profiles
- **`src/app/api/contacts/profiles/route.ts`**
  - `GET /api/contacts/profiles` — Fetch contact profile(s)
  - `POST /api/contacts/profiles` — Create or update contact profile
  - Tracks communication style, reliability, patterns
  - Links to historical interactions

#### Calendar Events
- **`src/app/api/calendar/events/route.ts`**
  - `GET /api/calendar/events` — Fetch events by date range
  - `POST /api/calendar/events` — Create calendar event
  - `PUT /api/calendar/events` — Update event
  - `DELETE /api/calendar/events` — Delete event
  - Auto-creates reminders based on event type
  - Links to emails, projects, contracts, sites

#### Command Center
- **`src/app/api/command-center/query/route.ts`**
  - `POST /api/command-center/query` — Natural language queries
  - Examples: "What needs my attention?" "Which vendors haven't responded?"
  - Returns AI-generated answers with data context
  - Auto-creates recommendations from analysis

- **`src/app/api/command-center/recommendations/route.ts`**
  - `GET /api/command-center/recommendations` — Fetch recommendations
  - `POST /api/command-center/recommendations` — Create recommendation
  - `PUT /api/command-center/recommendations` — Update status

- **`src/app/api/command-center/widgets/route.ts`**
  - `GET /api/command-center/widgets` — Fetch all dashboard widgets
  - Returns 7 widgets with aggregated data
  - Includes attention items, vendor intelligence, site status

### React Components

#### Email Inference Panel
- **`src/components/EmailInferencePanel.tsx`**
  - Displays all 13 inference points
  - Color-coded risk levels (green/yellow/red)
  - Shows action required with quick-action buttons
  - Displays sender pattern match
  - Shows confidence score with visual progress bar
  - "Add to Calendar", "Reply", "Link to Project" buttons

#### Calendar Widget
- **`src/components/CalendarWidget.tsx`**
  - Month view with event indicators
  - Week and Agenda views
  - Color-coded event types
  - Upcoming events sidebar
  - Navigation controls

#### Command Center Dashboard
- **`src/components/CommandCenter.tsx`**
  - AI Query interface (natural language Q&A)
  - "What Needs Attention Today" widget
  - Open action items
  - Weekly critical path
  - Vendor intelligence
  - Site status snapshot
  - Yesterday vs Today metrics
  - AI insights & patterns

### TypeScript Types
- **`src/types/intelligence.ts`**
  - Complete type definitions for all systems
  - Request/response interfaces
  - Enum types for all statuses

## Database Schema Summary

### 8 New Tables

#### 1. email_inferences
```sql
- id (UUID PK)
- email_id (FK → emails)
- site_id (FK → sites)
- sender_intent (text)
- hidden_urgency (boolean)
- expected_response (text)
- actual_request (text)
- action_items (JSONB array)
- missing_info (JSONB array)
- risk_level (enum: green, yellow, red)
- tone (enum: professional, casual, frustrated, demanding, friendly, neutral)
- deadline_pressure (text/timestamp)
- related_sites (JSONB array)
- related_projects (JSONB array)
- related_contracts (JSONB array)
- action_required (enum)
- sender_pattern_match (text)
- confidence_score (0-100)
- created_at, updated_at
```

#### 2. contact_profiles
```sql
- id (UUID PK)
- site_id (FK → sites)
- user_id (FK → users)
- contact_email (text)
- contact_id (FK → contacts, nullable)
- communication_style (enum)
- common_requests (JSONB array)
- associated_sites (JSONB array)
- associated_projects (JSONB array)
- urgency_pattern (text)
- response_expectations (JSONB)
- reliability_score (0-100)
- prior_commitments (JSONB array)
- preferred_tone (enum)
- pain_points (JSONB array)
- is_decision_maker (boolean)
- avg_response_time_hours (decimal)
- last_interacted_at (timestamp)
- interaction_count (integer)
- notes (text)
- created_at, updated_at
```

#### 3. sender_patterns
```sql
- id (UUID PK)
- contact_profile_id (FK → contact_profiles)
- site_id (FK → sites)
- pattern_type (enum: urgency_escalation, slow_response, etc.)
- pattern_data (JSONB)
- confidence (0-100)
- last_observed_at (timestamp)
- occurrences_count (integer)
- created_at, updated_at
```

#### 4. calendar_events
```sql
- id (UUID PK)
- site_id (FK → sites)
- user_id (FK → users)
- title (text)
- description (text)
- event_type (enum: meeting, reminder, deadline, follow_up, etc.)
- start_datetime (timestamp)
- end_datetime (timestamp, nullable)
- duration_minutes (integer, nullable)
- location (text, nullable)
- attendees (JSONB array)
- all_day (boolean)
- recurrence_rule (text, nullable)
- reminder_minutes_before (integer array)
- linked_email_id (FK → emails)
- linked_project_id (FK → projects)
- linked_contract_id (FK → contracts)
- linked_site_id (FK → sites)
- status (enum: scheduled, completed, cancelled, overdue)
- notes (text)
- created_at, updated_at
```

#### 5. calendar_reminders
```sql
- id (UUID PK)
- event_id (FK → calendar_events)
- reminder_type (enum: notification, email, sms)
- reminder_datetime (timestamp)
- sent (boolean)
- sent_at (timestamp, nullable)
- created_at
```

#### 6. recurring_tasks
```sql
- id (UUID PK)
- site_id (FK → sites)
- user_id (FK → users)
- title (text)
- description (text)
- recurrence (enum: daily, weekly, monthly, custom)
- recurrence_pattern (JSONB)
- linked_site_id (FK → sites)
- linked_project_id (FK → projects)
- enabled (boolean)
- created_at, updated_at
```

#### 7. workflow_patterns
```sql
- id (UUID PK)
- site_id (FK → sites)
- user_id (FK → users)
- pattern_type (enum)
- pattern_name (text)
- pattern_data (JSONB)
- frequency (text)
- last_occurred_at (timestamp)
- confidence (0-100)
- created_at, updated_at
```

#### 8. workflow_recommendations
```sql
- id (UUID PK)
- site_id (FK → sites)
- user_id (FK → users)
- recommendation_type (enum)
- recommendation_text (text)
- reason (text)
- related_items (JSONB)
- priority (enum: low, medium, high)
- status (enum: pending, dismissed, completed, archived)
- created_at
- expires_at (timestamp, nullable)
- dismissed_at (timestamp, nullable)
- completed_at (timestamp, nullable)
```

#### 9. ai_observations
```sql
- id (UUID PK)
- site_id (FK → sites)
- user_id (FK → users)
- observation_text (text)
- observation_type (enum)
- related_data (JSONB)
- importance (enum: low, medium, high)
- is_acknowledged (boolean)
- acknowledged_at (timestamp, nullable)
- timestamp (timestamp)
```

## Integration Points

### 1. Email Detail Page
When viewing an email:
- Inference panel appears (right sidebar)
- Shows all 13 analysis points
- Color-coded risk level badge
- Action required indicator
- Sender profile card with reliability score
- "Add to Calendar" quick button
- "Create Follow-up" button
- "Link to Project" button

### 2. Project Detail Page
When viewing a project:
- Shows linked emails (automatically found via inference)
- Calendar deadlines for the project
- AI risk assessment
- Follow-up suggestions
- Action items specific to project

### 3. Calendar Page
- Events auto-created from email deadlines
- Events auto-created from project deadlines
- Events auto-created from contract renewals
- Recurring tasks visible and manageable
- Add event form with AI pre-filled fields

### 4. Dashboard
- Calendar widget showing month view
- Command center widget for quick Q&A
- Attention items widget (top priority)
- Vendor intelligence widget
- Site status snapshot widget

### 5. Sidebar Navigation
- "Command Center" link in main nav
- Calendar quick access
- "Today's Schedule" indicator

## Setup Instructions

### Step 1: Database Schema

Execute `database_extensions.sql` in Supabase SQL Editor:

```bash
# Copy the entire contents of database_extensions.sql
# Go to Supabase → Your Project → SQL Editor
# Paste and execute (or run statement by statement if needed)
```

### Step 2: Update Dependencies

The project uses Claude API (already in `.env.local`). Ensure:

```bash
# Check CLAUDE_API_KEY is set in .env.local
# Should already be there from Phase 1 setup
```

### Step 3: Install New API Routes

The API files are ready to go. They'll be automatically loaded by Next.js:

```
src/app/api/
├── email/
│   └── infer/route.ts
├── contacts/
│   └── profiles/route.ts
├── calendar/
│   └── events/route.ts
└── command-center/
    ├── query/route.ts
    ├── recommendations/route.ts
    └── widgets/route.ts
```

### Step 4: Add Components to Pages

Add components to dashboard pages:

```tsx
// src/app/dashboard/page.tsx
import { CommandCenter } from '@/components/CommandCenter'
import { CalendarWidget } from '@/components/CalendarWidget'
import { EmailInferencePanel } from '@/components/EmailInferencePanel'

export default function Dashboard() {
  // ... existing dashboard code
  
  return (
    <div>
      <CommandCenter siteId={siteId} userId={userId} />
      <CalendarWidget siteId={siteId} userId={userId} />
    </div>
  )
}
```

### Step 5: Test the Systems

#### Test Email Inference
1. Go to Email Intel page
2. Paste an email
3. Look at the inference panel
4. Check all 13 analysis points appear

#### Test Contact Profiles
1. Create a new contact
2. System automatically builds profile over time
3. View profile to see communication patterns

#### Test Calendar
1. Click "Add to Calendar" on an email
2. Event appears on calendar
3. Reminders are auto-created

#### Test Command Center
1. Go to Command Center dashboard
2. Ask a question: "What needs my attention?"
3. AI analyzes all your data
4. Returns recommendations

## Usage Examples

### Email Inference API
```bash
curl -X POST http://localhost:3000/api/email/infer \
  -H "Content-Type: application/json" \
  -d '{
    "emailId": "uuid-here",
    "siteId": "uuid-here",
    "emailText": "Full email text here...",
    "senderEmail": "sender@example.com"
  }'
```

### Calendar Events API
```bash
curl -X POST http://localhost:3000/api/calendar/events \
  -H "Content-Type: application/json" \
  -d '{
    "siteId": "uuid-here",
    "userId": "uuid-here",
    "title": "Project Deadline",
    "eventType": "deadline",
    "startDatetime": "2024-12-31T17:00:00Z",
    "reminderMinutesBefore": [15, 60, 1440]
  }'
```

### Command Center Query API
```bash
curl -X POST http://localhost:3000/api/command-center/query \
  -H "Content-Type: application/json" \
  -d '{
    "siteId": "uuid-here",
    "userId": "uuid-here",
    "query": "What needs my attention today?"
  }'
```

## Data Flow

### Email Processing Flow
```
User receives email
    ↓
Email stored in DB
    ↓
Inference engine analyzes (Claude AI)
    ↓
13 inference points extracted
    ↓
Sender contact profile checked/updated
    ↓
Pattern matching performed
    ↓
Risk level assigned
    ↓
Action required determined
    ↓
Recommendation possibly generated
    ↓
Calendar event potentially auto-created
```

### Command Center Intelligence Flow
```
User asks question in Command Center
    ↓
AI gathers all relevant data:
  - Emails (with inferences)
  - Projects (status, deadlines)
  - Action items (open)
  - Contracts (renewal dates)
  - Calendar events (upcoming)
  - Contact patterns
    ↓
Claude AI analyzes in context
    ↓
Generates actionable answer
    ↓
Creates recommendation if needed
    ↓
Stores observation/pattern
    ↓
Returns answer to user
```

## Learning Mechanisms

### Contact Profile Learning
- Every email updates `last_interacted_at`
- `interaction_count` increments
- `reliability_score` calculated from:
  - Do they follow through on commitments?
  - How fast do they respond?
  - Are they usually urgent?
- `avg_response_time_hours` tracked
- `urgency_pattern` learned from historical urgency flags

### Pattern Detection
- Specific patterns detected and stored in `sender_patterns`
- Examples:
  - "Always marks urgent but rarely follows up"
  - "Responds slowly but very thorough"
  - "Quick responder, prefers brief emails"
- Confidence score shows reliability (0-100%)

### Workflow Pattern Learning
- System observes what you do repeatedly
- Records as workflow patterns
- Detects:
  - Daily tasks
  - Recurring decision patterns
  - Common action sequences
  - Escalation workflows

## Performance & Scaling

### Indexes for Query Speed
- `idx_email_inferences_email_id` — Fast email lookup
- `idx_email_inferences_risk_level` — Filter by risk
- `idx_calendar_events_start_datetime` — Range queries
- `idx_workflow_recommendations_user_id` — User-specific queries
- `idx_contact_profiles_last_interacted_at` — Recent contacts

### Rate Limiting
- Claude API calls rate limited per `.env` key
- Recommend: Cache inferences for 24h if email not changed
- Batch recommendations generation (run hourly)

### Data Retention
- Keep email inferences indefinitely (useful for patterns)
- Archive recommendations older than 30 days
- Auto-clean observations older than 90 days

## Future Enhancements

### Phase 4 Additions
- [ ] Real email webhook integration (automatic inference)
- [ ] Bulk email analysis
- [ ] Custom pattern templates
- [ ] Scheduled reports
- [ ] Slack/Teams integration

### Phase 5 Advanced
- [ ] ML-powered confidence scoring
- [ ] Predictive recommendations
- [ ] Anomaly detection alerts
- [ ] Custom workflow builders
- [ ] Integration marketplace

## Troubleshooting

### Email Inference Fails
- Check Claude API key in `.env.local`
- Verify email text is not empty
- Check Supabase connection

### Calendar Events Not Appearing
- Verify user_id and site_id are correct
- Check browser timezone
- Clear browser cache

### Command Center Returns Empty
- Ensure you have projects/emails/contracts in the system
- Check user_id matches authenticated user
- Verify data is accessible (RLS policies)

### Recommendations Not Generated
- Check if query triggers heuristics
- Look at `workflow_recommendations` table
- Verify Claude API responses

## Support

For issues or questions:
1. Check `SETUP.md` for environment setup
2. Review Supabase docs for schema questions
3. Check Claude API docs for AI issues
4. Review React component code for UI problems

---

**Built with Next.js 14, Supabase, Claude 3.5 Sonnet, and Tailwind CSS**
