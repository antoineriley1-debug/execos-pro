# Deployment Checklist - Memory, Files & Search

Complete checklist for deploying the three new features to production.

---

## PRE-DEPLOYMENT

### Code Review
- [ ] Review all API routes for security
- [ ] Check RLS policies are correct
- [ ] Verify no hardcoded credentials
- [ ] Test all error handling
- [ ] Review file upload validation
- [ ] Check authentication on all endpoints

### Testing
- [ ] Unit tests for memory CRUD
- [ ] Unit tests for file upload
- [ ] Integration tests for search
- [ ] Test RLS policies with different users
- [ ] Test file size limits
- [ ] Test duplicate detection
- [ ] Load test with large datasets

### Documentation
- [ ] Update API documentation
- [ ] Document all environment variables
- [ ] Create user guides
- [ ] Document integration points
- [ ] Add troubleshooting guide

---

## DATABASE SETUP

### Step 1: Create Supabase Tables

```bash
# In Supabase SQL Editor, run:
-- Execute the full content of database_memory_files.sql
```

**Verify each table exists:**
```sql
SELECT tablename FROM pg_tables WHERE schemaname='public';
```

Should show:
- memory_entries
- memory_tags
- memory_file_links
- documents_extended
- file_uploads
- file_folders
- document_folder_mapping
- unified_search_index

### Step 2: Create Storage Bucket

```bash
# In Supabase Storage:
1. Create bucket named "documents"
2. Set Access Level: Private
3. Add Policy for authenticated users:
   - SELECT: authenticated users can view their files
   - INSERT: authenticated users can upload
   - UPDATE: authenticated users can update
   - DELETE: authenticated users can delete
```

**RLS Policy SQL:**
```sql
-- Create for authenticated users only
create policy "Users can upload files"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'documents');

create policy "Users can view their files"
on storage.objects
for select
to authenticated
using (bucket_id = 'documents' and auth.uid() = owner);

create policy "Users can delete their files"
on storage.objects
for delete
to authenticated
using (bucket_id = 'documents' and auth.uid() = owner);
```

### Step 3: Verify Indexes

```sql
-- Check all indexes created
SELECT indexname FROM pg_indexes WHERE schemaname='public';
```

Should include:
- idx_memory_entries_user_id
- idx_memory_entries_memory_type
- idx_memory_entries_site_id
- idx_memory_entries_is_pinned
- idx_documents_extended_user_id
- idx_documents_extended_file_type
- idx_documents_extended_linked_site_id
- idx_file_uploads_user_id
- idx_unified_search_index_user_id
- Full-text search indexes

### Step 4: Test Database Access

```bash
# With service role key
curl -X GET "https://your-supabase.co/rest/v1/memory_entries" \
  -H "Authorization: Bearer YOUR_SERVICE_KEY" \
  -H "Content-Type: application/json"
```

---

## APPLICATION SETUP

### Step 1: Install Dependencies

```bash
cd execos-pro
npm install
# No new dependencies required - using existing @supabase/supabase-js
```

### Step 2: Environment Variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# File Upload
NEXT_PUBLIC_MAX_FILE_SIZE=104857600  # 100MB in bytes
```

### Step 3: Verify File Paths

Check all imports in new files:
```bash
grep -r "from '@/lib" src/app/api/memory/
grep -r "from '@/lib" src/app/api/files/
grep -r "from '@/components" src/app/dashboard/
```

Should use @/ alias which is configured in tsconfig.json

### Step 4: Build Test

```bash
npm run build
```

Should complete without errors. Check for:
- [ ] No TypeScript errors
- [ ] No missing imports
- [ ] API routes compile
- [ ] Components compile

---

## API ENDPOINT TESTING

### Test Memory API

```bash
# Get token (use your auth method)
TOKEN="your_bearer_token"

# Create memory
curl -X POST "http://localhost:3000/api/memory" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "memoryType": "global",
    "title": "Test Memory",
    "content": "This is a test"
  }'

# Expected response: 201 with memory object

# List memories
curl -X GET "http://localhost:3000/api/memory?type=global" \
  -H "Authorization: Bearer $TOKEN"

# Expected response: 200 with memory list

# Get single memory
curl -X GET "http://localhost:3000/api/memory/{id}" \
  -H "Authorization: Bearer $TOKEN"

# Expected response: 200 with memory object

# Update memory
curl -X PUT "http://localhost:3000/api/memory/{id}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "content": "Updated content"
  }'

# Expected response: 200 with updated memory

# Delete memory
curl -X DELETE "http://localhost:3000/api/memory/{id}" \
  -H "Authorization: Bearer $TOKEN"

# Expected response: 200 with {"success": true}
```

### Test File API

```bash
# Upload file
curl -X POST "http://localhost:3000/api/files/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/test.pdf"

# Expected response: 201 with document object

# List files
curl -X GET "http://localhost:3000/api/files" \
  -H "Authorization: Bearer $TOKEN"

# Expected response: 200 with files list

# Get file detail
curl -X GET "http://localhost:3000/api/files/{id}" \
  -H "Authorization: Bearer $TOKEN"

# Expected response: 200 with file object

# Update file metadata
curl -X PUT "http://localhost:3000/api/files/{id}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isStarred": true,
    "aiTags": ["important", "contract"]
  }'

# Expected response: 200 with updated file

# Delete file
curl -X DELETE "http://localhost:3000/api/files/{id}" \
  -H "Authorization: Bearer $TOKEN"

# Expected response: 200 with {"success": true}
```

### Test Search API

```bash
# Search unified
curl -X GET "http://localhost:3000/api/search/unified?q=test&sourceType=all" \
  -H "Authorization: Bearer $TOKEN"

# Expected response: 200 with {
#   "results": [...],
#   "total": n,
#   "query": "test"
# }
```

---

## UI COMPONENT TESTING

### Memory Manager
- [ ] Load page, see empty state
- [ ] Create new memory
- [ ] Edit existing memory
- [ ] Delete memory (with confirmation)
- [ ] Search memories
- [ ] Filter by type
- [ ] Filter by site
- [ ] Pin/unpin memory
- [ ] View tags

### File Upload Manager
- [ ] Load page, see upload zone
- [ ] Single file upload
- [ ] Bulk file upload
- [ ] Drag-drop files
- [ ] See upload progress
- [ ] View uploaded files
- [ ] Download file
- [ ] Delete file
- [ ] Star/unstar file
- [ ] File detail view

### Unified Search
- [ ] Load search page
- [ ] Search with minimum 2 chars
- [ ] See results from memory + files
- [ ] Filter by type (Memory/File/All)
- [ ] Results show correct icons
- [ ] Results show metadata
- [ ] Pin/star indicators visible
- [ ] Click result to view detail

---

## SECURITY TESTING

### RLS Policy Testing

```bash
# Create two test users
# User A: Create memory/files
# User B: Try to access User A's data

# Test 1: User B cannot see User A's memory
curl -X GET "http://localhost:3000/api/memory" \
  -H "Authorization: Bearer USER_B_TOKEN"
# Should return empty list

# Test 2: User B cannot delete User A's memory
curl -X DELETE "http://localhost:3000/api/memory/{USER_A_MEMORY_ID}" \
  -H "Authorization: Bearer USER_B_TOKEN"
# Should return 404 or 403

# Test 3: User B cannot download User A's files
curl -X GET "http://localhost:3000/api/files/{USER_A_FILE_ID}" \
  -H "Authorization: Bearer USER_B_TOKEN"
# Should return 404 or 403
```

### File Upload Security

```bash
# Test 1: Upload disallowed file type
curl -X POST "http://localhost:3000/api/files/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/test.exe"
# Should return 400 with error

# Test 2: Upload file exceeding size limit
# Create 101MB file and try to upload
# Should return 400 with error

# Test 3: Verify file stored in correct path
# File should be stored in: {user_id}/{timestamp}-{filename}
# Not accessible without auth
```

### Authentication Testing

```bash
# Test 1: API without token
curl -X GET "http://localhost:3000/api/memory"
# Should return 401

# Test 2: API with invalid token
curl -X GET "http://localhost:3000/api/memory" \
  -H "Authorization: Bearer invalid_token"
# Should return 401

# Test 3: API with expired token
# Should return 401 and prompt re-auth
```

---

## PERFORMANCE TESTING

### Load Test Memory

```bash
# Create 1000 memory entries
# Query all with pagination
# Time should be <200ms

for i in {1..1000}; do
  curl -X POST "http://localhost:3000/api/memory" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"memoryType\": \"global\",
      \"title\": \"Memory $i\",
      \"content\": \"Content for memory $i\"
    }"
done

# Time the list query
time curl -X GET "http://localhost:3000/api/memory?limit=50" \
  -H "Authorization: Bearer $TOKEN"
```

### Load Test Files

```bash
# Upload 100 files
# List all with pagination
# Time should be <200ms

# Time the list query
time curl -X GET "http://localhost:3000/api/files?limit=50" \
  -H "Authorization: Bearer $TOKEN"
```

### Search Performance

```bash
# Search with 1000+ entries
# Should complete <500ms

time curl -X GET "http://localhost:3000/api/search/unified?q=test" \
  -H "Authorization: Bearer $TOKEN"
```

---

## BROWSER TESTING

### Desktop Chrome
- [ ] Memory manager responsive
- [ ] File upload drag-drop works
- [ ] Search results display properly
- [ ] Pagination works
- [ ] Modals display correctly
- [ ] Rich text editor works

### Desktop Firefox
- [ ] All UI elements render
- [ ] File upload works
- [ ] Forms submit correctly

### Mobile (Safari/Chrome)
- [ ] Responsive layout
- [ ] Touch-friendly buttons
- [ ] File upload from camera/gallery
- [ ] Search on mobile

### Tablet
- [ ] Layout works on 768px+
- [ ] Navigation accessible
- [ ] Dropdowns work

---

## MONITORING SETUP

### Database Monitoring

In Supabase Dashboard:
- [ ] Set up slow query alerts
- [ ] Monitor row count growth
- [ ] Monitor storage usage
- [ ] Set up replication alerts

### API Monitoring

In your logging service:
- [ ] Track API error rates
- [ ] Monitor response times
- [ ] Alert on 5xx errors
- [ ] Track file upload sizes

### User Analytics

- [ ] Track feature adoption
- [ ] Monitor memory creation rate
- [ ] Monitor file upload rate
- [ ] Track search usage

---

## PRODUCTION DEPLOYMENT

### Step 1: Backup

```bash
# Backup Supabase data
# Before deploying to production
```

### Step 2: Deploy Code

```bash
git add src/app/api/memory
git add src/app/api/files
git add src/app/api/search
git add src/app/dashboard/memory
git add src/app/dashboard/files
git add src/app/dashboard/search
git add src/components/MemoryManager.tsx
git add src/components/FileUploadManager.tsx
git add src/components/UnifiedSearch.tsx
git add src/lib/ai-context.ts
git add src/types/memory.ts
git commit -m "feat: Add memory, file upload, and unified search features"
git push origin main

# Deploy to Vercel (or your hosting)
```

### Step 3: Run Database Migrations

```bash
# Execute database_memory_files.sql in production Supabase
# Done through Supabase dashboard or migration tool
```

### Step 4: Verify

```bash
# Test all endpoints in production
# Test with real data
# Verify RLS policies
# Check logs for errors
```

### Step 5: Announce

- [ ] Update user documentation
- [ ] Send release notes
- [ ] Announce in changelog
- [ ] Update help documentation

---

## POST-DEPLOYMENT

### Day 1
- [ ] Monitor error logs
- [ ] Check response times
- [ ] Verify file uploads working
- [ ] Test cross-browser

### Day 3-7
- [ ] Review analytics
- [ ] Check user feedback
- [ ] Monitor database growth
- [ ] Verify backups running

### Week 1+
- [ ] Weekly performance review
- [ ] Monthly data cleanup (archive old memories)
- [ ] Update documentation based on feedback
- [ ] Plan improvements

---

## ROLLBACK PROCEDURE

If issues occur:

```bash
# Revert code
git revert <commit-hash>
git push origin main

# Database rollback (Supabase)
# Use point-in-time recovery if available
# Or restore from backup

# Clear cache
# Flush CDN caches
# Clear browser caches
```

---

## COMMON ISSUES & SOLUTIONS

### Issue: File Upload Returns 403
**Cause:** Storage bucket not created or RLS policies wrong
**Solution:** 
1. Create "documents" bucket in Supabase Storage
2. Verify RLS policies allow authenticated uploads
3. Check service role key has storage access

### Issue: Memory Not Showing
**Cause:** RLS policies preventing access
**Solution:**
1. Verify user_id matches auth user
2. Check table is_archived flag
3. Verify RLS policies allow SELECT

### Issue: Search Returns No Results
**Cause:** Full-text search indexes not created
**Solution:**
1. Run CREATE INDEX for GIN full-text search
2. Verify search_text column has content
3. Check user_id filtering

### Issue: File Upload Slow
**Cause:** Large file or slow network
**Solution:**
1. Implement chunked upload for files >10MB
2. Show better progress UI
3. Allow pause/resume

### Issue: Out of Storage
**Cause:** Too many files or large files
**Solution:**
1. Implement file cleanup/archiving
2. Warn when approaching limit
3. Offer file compression

---

## SUPPORT CONTACT

For deployment issues:
- Check Supabase status page
- Review API logs in Supabase
- Check application error logs
- Test with curl commands
- Verify environment variables

---

## SIGN-OFF

- [ ] QA Lead: All tests passed
- [ ] Security Review: RLS policies verified
- [ ] Database Admin: Backups configured
- [ ] DevOps: Monitoring set up
- [ ] Product: Feature complete
- [ ] Documentation: Updated

**Deployed by:** ________________
**Date:** ________________
**Version:** ________________

---

**Deployment Complete!** 🎉

The Memory, Files, and Unified Search features are now live.
Monitor performance and user adoption closely in the first week.
