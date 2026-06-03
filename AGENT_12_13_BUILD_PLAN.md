# EXECOS Pro - Agent 12 & 13 Build Plan

**Status:** Starting build  
**Date:** 2026-06-03  
**Goal:** Complete Agents 12 & 13, then deploy to Render

---

## 🎯 Agent 12: Data Synthesis + AI Dialogue

### Requirements

1. **Weekly Automatic Synthesis**
   - Ingest: emails, contracts, investigations, calendar events
   - Aggregate all data from the week
   - Trigger automatically every Friday EOD

2. **Compression Algorithm**
   - Reduce 1000+ pages → 10-page executive summary
   - Token-optimized compression using Claude API
   - Preserve critical decisions, risks, key players

3. **Archival System**
   - Store compressed summaries in time-indexed database
   - Supabase table: `synthesis_archives` (id, week_start, week_end, content, created_at)
   - Support historical retrieval (view past syntheses)

4. **AI Dialogue**
   - Ask questions about synthesized data
   - Claude processes questions against archived summaries
   - Return answers with source references

5. **Timeline View**
   - Show historical synthesis journey
   - Display: week number, summary date, page count reduction, key metrics

### Implementation Plan

**Database:**
- `synthesis_archives` — store compressed summaries
- `synthesis_queries` — track Q&A history
- Add RLS policies for user isolation

**API Routes:**
- `POST /api/synthesis/trigger` — manually trigger synthesis (admin)
- `POST /api/synthesis/generate` — run compression algorithm
- `POST /api/synthesis/query` — ask questions about synthesis
- `GET /api/synthesis/timeline` — get historical list
- `GET /api/synthesis/[id]` — retrieve specific synthesis

**Frontend:**
- `/dashboard/synthesis` page
  - Timeline view (cards showing week → summary)
  - Summary viewer (read full compressed summary)
  - Q&A interface (ask questions, show answers)
  - Historical browser (filter by date range)

**Cron Job:**
- Use Render's cron service or a scheduled worker
- Run every Friday 5 PM EST
- Ingest data from: emails table, contracts table, calendar events table
- Generate synthesis and store

---

## 🎯 Agent 13: Bulk Investigation

### Requirements

1. **Multi-File Upload Interface**
   - Drag/drop file upload
   - Support: .pdf, .docx, .txt, .eml, .msg files
   - Show upload progress
   - Preview file list before analysis

2. **Multi-Email Upload**
   - Paste email threads
   - Upload .eml files (Apple Mail, Thunderbird exports)
   - Upload .msg files (Outlook exports)
   - Auto-parse and extract metadata (sender, date, recipients, body)

3. **Batch AI Analysis**
   - Analyze all files in parallel (max 5 concurrent)
   - Use Claude to extract insights from each
   - Generate consistent summaries

4. **Individual + Aggregate Summaries**
   - Per-file summary (what was analyzed, key findings)
   - Aggregate summary (common themes, risks, actors, patterns)
   - Risk scoring (high/medium/low)

5. **Export Results**
   - **PDF:** Professional report with all summaries
   - **JSON:** Structured data for system integration
   - **CSV:** Individual file records + aggregate metrics

### Implementation Plan

**Database:**
- `bulk_investigations` — tracking batch jobs
- `investigation_files` — individual file records
- `investigation_summaries` — per-file analysis results
- `investigation_aggregates` — batch-level summaries
- Add RLS policies

**API Routes:**
- `POST /api/investigations/bulk/upload` — receive files
- `POST /api/investigations/bulk/analyze` — start analysis
- `GET /api/investigations/bulk/[jobId]/status` — check progress
- `GET /api/investigations/bulk/[jobId]/results` — get results
- `POST /api/investigations/bulk/[jobId]/export` — export as PDF/JSON/CSV
- `GET /api/investigations/bulk/[jobId]/files` — list files in job

**Frontend:**
- `/dashboard/investigations` page
  - Multi-file dropzone
  - Email import interface (paste/upload)
  - Upload progress tracker
  - Results viewer (individual + aggregate)
  - Export buttons (PDF, JSON, CSV)
  - Job history

**Processing:**
- Queue system using: Node.js async queue or Supabase Edge Functions
- Parallel processing (max 5 files at a time)
- Token counting and batching (avoid exceeding Claude's limits)

---

## 📊 Implementation Order

### Phase 1: Agent 12 (Days 1-2)
1. Create database schema for synthesis
2. Build API routes for synthesis
3. Build synthesis generation logic (compression algorithm)
4. Create frontend page
5. Test manual triggers

### Phase 2: Agent 13 (Days 2-3)
1. Create database schema for investigations
2. Build file upload & parsing
3. Build batch analysis logic
4. Build export logic (PDF, JSON, CSV)
5. Create frontend page
6. Test with sample files

### Phase 3: Deployment (Day 3)
1. Update .env with all required keys
2. Deploy Next.js app to Render
3. Set up cron for synthesis
4. Run smoke tests
5. Provide live URL

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, React, TypeScript
- **Backend:** Next.js API routes
- **Database:** Supabase (PostgreSQL)
- **File Processing:** Multer (uploads), pdf-parse (PDFs), mammoth (DOCX)
- **Email Parsing:** email-parser, nodemailer-parse-mail
- **AI:** Anthropic Claude API
- **Export:** jsPDF, json2csv, papaparse
- **Deployment:** Render.com

---

## 🔐 Environment Variables Needed

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
```

---

## 📝 Progress Tracking

- [x] Build plan created
- [ ] Agent 12 database schema
- [ ] Agent 12 API routes
- [ ] Agent 12 compression algorithm
- [ ] Agent 12 frontend
- [ ] Agent 13 database schema
- [ ] Agent 13 file upload & parsing
- [ ] Agent 13 batch analysis
- [ ] Agent 13 export logic
- [ ] Agent 13 frontend
- [ ] Deploy to Render
- [ ] Live URL provided

---

## 🎯 Success Criteria

**Agent 12:**
- [ ] Synthesis can be triggered manually
- [ ] Generates 10-page summary from ingested data
- [ ] Stores in database with timestamp
- [ ] Can retrieve historical summaries
- [ ] Can ask questions about synthesis
- [ ] Timeline view shows all syntheses
- [ ] Works with real data from emails, contracts, calendar

**Agent 13:**
- [ ] Upload interface accepts drag/drop
- [ ] Can parse .eml, .msg, .pdf, .docx, .txt files
- [ ] Analyzes all files in a batch
- [ ] Generates individual summaries
- [ ] Generates aggregate summary
- [ ] Exports to PDF, JSON, CSV
- [ ] Shows progress during analysis
- [ ] Handles errors gracefully

**Deployment:**
- [ ] App builds without errors
- [ ] Connects to Supabase successfully
- [ ] Live URL provided
- [ ] Both agents work on production
- [ ] GitHub repo updated

---

## 💡 Notes

- Synthesis compression must be smart (not just truncation)
- Investigation export must be professional (PDF quality)
- Both agents must handle errors gracefully (show user-friendly messages)
- Performance: synthesis <30s, investigation analysis <60s per file
- Security: all file uploads validated, size limits enforced, RLS policies strict
