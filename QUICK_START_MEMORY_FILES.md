# Quick Start - Memory, Files & Search Features

Get up and running with the new features in 5 minutes.

---

## 1️⃣ SETUP (2 minutes)

### A. Database
```sql
-- Go to Supabase SQL Editor
-- Copy & paste entire content from database_memory_files.sql
-- Run the script
-- ✅ All tables, indexes, and RLS policies created
```

### B. Storage
```
1. Go to Supabase Storage → Create bucket
2. Name: "documents"
3. Access: Private
4. ✅ Ready for uploads
```

### C. Environment Variables
```env
# Already configured in your .env.local
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

---

## 2️⃣ USE THE FEATURES (1 minute)

### A. Memory Management
```
1. Go to http://localhost:3000/dashboard/memory
2. Click "+ New Memory"
3. Create a memory entry
4. ✅ Memory created
```

### B. File Upload
```
1. Go to http://localhost:3000/dashboard/files
2. Drag & drop a PDF (or click browse)
3. ✅ File uploaded
```

### C. Search Everything
```
1. Go to http://localhost:3000/dashboard/search
2. Type to search memory + files
3. ✅ Results appear in real-time
```

---

## 3️⃣ INTEGRATE WITH AI (1 minute)

### Use Memory in Your AI Code
```typescript
import { getFullAIContext, createAISystemPrompt } from '@/lib/ai-context'

// Before analyzing an email
const context = await getFullAIContext(userId, siteId)
const systemPrompt = createAISystemPrompt(context)

// Pass to Claude/API
const response = await claude.messages.create({
  system: systemPrompt,  // Memory context injected!
  messages: [...]
})
```

### Reference Memory in Responses
```typescript
const response = {
  answer: "Based on your saved memory, ...",
  sources: {
    memoryIds: ["id-1", "id-2"],
    fileIds: ["id-3"],
  }
}
```

---

## 4️⃣ TEST EVERYTHING (1 minute)

### Test Memory API
```bash
TOKEN="your_bearer_token"

# Create
curl -X POST http://localhost:3000/api/memory \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"memoryType":"global","title":"Test","content":"Content"}'

# List
curl http://localhost:3000/api/memory \
  -H "Authorization: Bearer $TOKEN"
```

### Test File API
```bash
# Upload
curl -X POST http://localhost:3000/api/files/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.pdf"

# List
curl http://localhost:3000/api/files \
  -H "Authorization: Bearer $TOKEN"
```

### Test Search API
```bash
curl http://localhost:3000/api/search/unified?q=test \
  -H "Authorization: Bearer $TOKEN"
```

---

## 5️⃣ FEATURES YOU NOW HAVE

### Memory System
- ✅ Create/edit/delete memories
- ✅ Organize by type (global, site, project, contact)
- ✅ Search & filter
- ✅ Pin important entries
- ✅ Tag system
- ✅ Access tracking

### File Management
- ✅ Single & bulk upload
- ✅ Drag-drop support
- ✅ File preview
- ✅ Download & delete
- ✅ Duplicate detection
- ✅ Link to projects/sites

### Search
- ✅ Unified search across memory & files
- ✅ Real-time results
- ✅ Type filtering
- ✅ Tag filtering
- ✅ Smart sorting

### AI Integration
- ✅ Memory context in prompts
- ✅ File reference in analysis
- ✅ Access tracking
- ✅ Source citations

---

## 📂 KEY FILES

**API Routes:**
```
src/app/api/memory/route.ts              ← Create/list memory
src/app/api/memory/[id]/route.ts         ← Get/update/delete
src/app/api/files/upload/route.ts        ← Upload files
src/app/api/files/route.ts               ← List files
src/app/api/files/[id]/route.ts          ← Get/update/delete
src/app/api/search/unified/route.ts      ← Search
```

**UI Components:**
```
src/components/MemoryManager.tsx         ← Memory UI
src/components/FileUploadManager.tsx     ← File upload UI
src/components/UnifiedSearch.tsx         ← Search UI
```

**Pages:**
```
src/app/dashboard/memory/page.tsx        ← /dashboard/memory
src/app/dashboard/files/page.tsx         ← /dashboard/files
src/app/dashboard/search/page.tsx        ← /dashboard/search
```

**AI Integration:**
```
src/lib/ai-context.ts                    ← AI context functions
```

---

## 🔑 KEY FUNCTIONS

### For Memory
```typescript
// Get all relevant memory for a site
const memories = await getSiteMemoryContext(userId, siteId)

// Get memory by type
const global = await getGlobalMemory(userId)
const siteMemories = await getSiteMemoryContext(userId, siteId)
const projectMemories = await getProjectMemory(userId, projectId)
const contactMemories = await getContactMemory(userId, contactId)
```

### For Files
```typescript
// Get files for a site
const files = await getSiteFileContext(userId, siteId)

// Format for AI
const formatted = formatFilesForAI(files)
```

### For AI
```typescript
// Get full context with memory + files
const context = await getFullAIContext(userId, siteId)

// Create system prompt with context
const prompt = createAISystemPrompt(context)

// Search for relevant context
const context = await searchContextForQuery(userId, query)
```

---

## 💡 COMMON TASKS

### Save Email Analysis as Memory
```typescript
await fetch('/api/memory', {
  method: 'POST',
  body: JSON.stringify({
    memoryType: 'site',
    siteId: email.site_id,
    title: `Email from ${email.from}`,
    content: `Subject: ${email.subject}\nAction: ...`,
    tags: ['email', 'follow-up']
  })
})
```

### Link File to Project
```typescript
await fetch(`/api/files/${fileId}`, {
  method: 'PUT',
  body: JSON.stringify({
    linkedProjectId: projectId
  })
})
```

### Search for Context
```typescript
const { memories, files } = await searchContextForQuery(userId, 'HVAC maintenance')
```

### Get AI Context for Email Analysis
```typescript
const context = await getFullAIContext(userId, siteId, projectId)
const systemPrompt = createAISystemPrompt(context)
// Use systemPrompt in API call
```

---

## 🐛 TROUBLESHOOTING

**Q: File upload returns 403**
- A: Check storage bucket "documents" exists and RLS allows authenticated uploads

**Q: Memory not showing**
- A: Check user_id in database matches auth user

**Q: Search returns empty**
- A: Verify full-text search indexes created (check database_memory_files.sql ran)

**Q: AI context empty**
- A: Verify memories/files exist in database for that user/site

**Q: "Unauthorized" error**
- A: Check auth token is valid and included in Authorization header

---

## 📚 FULL DOCUMENTATION

For detailed information:
- **MEMORY_FILES_FEATURES.md** - Complete feature docs
- **INTEGRATION_GUIDE.md** - Integration examples
- **DEPLOYMENT_CHECKLIST.md** - Deployment steps

---

## ✅ DONE!

You now have three production-ready features:
1. 🧠 Memory Management
2. 📁 File Upload & Management
3. 🔍 Unified Search

All integrated with AI for contextual intelligence.

Happy building! 🚀
