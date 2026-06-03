# EXECOS Pro - Memory, Files & Unified Search Features

Complete implementation of three integrated features for EXECOS Pro:

1. **Memory Management System**
2. **File Upload & Management**
3. **Unified Memory + File Search**

---

## PART 1: MEMORY MANAGEMENT SYSTEM

### Overview
A comprehensive memory management system where users can save arbitrary notes and AI can recall them contextually. Memories are organized by type (global, site, project, contact) with full tagging, pinning, and access tracking.

### Key Features

#### Memory Types
- **Global Memory** - User-wide notes, procedures, preferences (applies everywhere)
- **Site Memory** - Hospital-specific procedures, issues, contacts, maintenance patterns
- **Project Memory** - Project decisions, vendor commitments, scope notes
- **Contact Memory** - Person/vendor communication preferences, reliability, history

#### Memory Operations
1. **Create** - New memory entries with title, content, tags
2. **Read** - View all memories with filtering and search
3. **Update** - Edit existing memory entries
4. **Delete** - Archive or permanently remove memories
5. **Pin** - Pin important entries to top
6. **Tag** - Organize with custom tags
7. **Search** - Full-text search across all memory types
8. **Export** - Save memory as text/PDF

#### Database Schema

**memory_entries** table:
```
- id (UUID)
- user_id (UUID) - FK to users
- memory_type (text) - global | site | project | contact
- site_id (UUID) - FK to sites (if site memory)
- project_id (UUID) - FK to projects (if project memory)
- contact_id (UUID) - FK to contacts (if contact memory)
- title (text) - Memory title
- content (text) - Full memory content
- tags (JSONB) - Array of tags
- is_pinned (boolean) - Pinned to top
- is_archived (boolean) - Soft delete
- created_at (timestamp)
- updated_at (timestamp)
- last_accessed_at (timestamp) - When AI last read this
- access_count (integer) - How many times AI referenced
```

**memory_tags** table:
```
- id (UUID)
- user_id (UUID)
- tag_name (text)
- tag_color (text) - UI color
- memory_count (integer) - Count of memories with this tag
- created_at (timestamp)
```

**memory_file_links** table:
```
- id (UUID)
- memory_id (UUID) - FK to memory_entries
- file_id (UUID) - FK to documents_extended
- created_at (timestamp)
```

#### API Routes

```
GET    /api/memory                    - List all memory (with filters)
POST   /api/memory                    - Create new memory
GET    /api/memory/[id]               - Get memory detail
PUT    /api/memory/[id]               - Update memory
DELETE /api/memory/[id]               - Delete memory
```

Query Parameters:
- `type` - Filter by memory type (global|site|project|contact)
- `siteId` - Filter by site (for site memory)
- `projectId` - Filter by project (for project memory)
- `contactId` - Filter by contact (for contact memory)
- `search` - Full-text search
- `tags` - Filter by tags (comma-separated)
- `limit` - Pagination limit (default 50)
- `offset` - Pagination offset (default 0)

#### UI Components

**MemoryManager** (`components/MemoryManager.tsx`)
- Memory type selector dropdown
- Site dropdown (when site memory selected)
- Search bar with real-time filtering
- Create new memory button
- Memory list with cards (color-coded by type)
- Memory detail view with edit mode
- Access tracking display

**MemoryDetailView**
- Title and content display
- Edit mode with textarea
- Tag display
- Metadata (created, updated, access count)
- Delete button
- Pin/unpin toggle

**MemoryCreateForm**
- Title input
- Rich text content area
- Tag selector
- Save/cancel buttons

#### Pages
- `/dashboard/memory` - Full memory management interface

---

## PART 2: FILE UPLOAD & MANAGEMENT SYSTEM

### Overview
A professional file management system with single and bulk upload capabilities, file organization, preview, and AI-powered analysis.

### Key Features

#### File Operations
1. **Single Upload** - Click or drag-drop single file
2. **Bulk Upload** - Upload multiple files with progress tracking
3. **Organization** - Link to projects, sites, contracts or create folders
4. **Management** - Download, delete, rename, move files
5. **Preview** - Inline preview for images/PDFs
6. **Search** - Search by filename, content, type
7. **Star** - Mark important files
8. **AI Analysis** - Auto-extract text, generate summary, tag files

#### Database Schema

**documents_extended** table:
```
- id (UUID)
- user_id (UUID) - FK to users
- filename (text)
- file_type (text) - pdf|doc|docx|xlsx|csv|txt|image|jpg|png|gif|other
- file_url (text) - Supabase Storage path
- file_size (integer) - Bytes
- file_hash (text) - SHA256 for duplicate detection
- uploaded_at (timestamp)
- linked_project_id (UUID) - FK to projects (optional)
- linked_site_id (UUID) - FK to sites (optional)
- linked_contract_id (UUID) - FK to contracts (optional)
- extracted_text (text) - OCR/text extraction result
- ai_summary (text) - AI-generated summary
- ai_tags (JSONB) - AI-generated tags
- is_starred (boolean) - Starred files
- created_at (timestamp)
- updated_at (timestamp)
```

**file_uploads** table:
```
- id (UUID)
- user_id (UUID)
- filename (text)
- status (text) - uploading | completed | failed
- progress_percent (integer) - 0-100
- file_size (integer)
- error_message (text) - If failed
- created_at (timestamp)
- completed_at (timestamp)
```

**file_folders** table:
```
- id (UUID)
- user_id (UUID)
- site_id (UUID) - FK to sites (optional)
- folder_name (text)
- folder_path (text)
- created_at (timestamp)
- updated_at (timestamp)
```

**document_folder_mapping** table:
```
- id (UUID)
- document_id (UUID) - FK to documents_extended
- folder_id (UUID) - FK to file_folders
- created_at (timestamp)
```

#### API Routes

```
POST   /api/files/upload              - Single file upload
POST   /api/files/upload-bulk         - Bulk file upload
GET    /api/files                     - List files (with filters)
GET    /api/files/[id]                - Get file detail
PUT    /api/files/[id]                - Update file metadata
DELETE /api/files/[id]                - Delete file
POST   /api/files/[id]/analyze        - Trigger AI analysis
GET    /api/files/search              - Search files
POST   /api/files/[id]/link           - Link to project/site/contract
GET    /api/files/[id]/download       - Download file
```

#### File Validation
- Allowed types: PDF, Word, Excel, CSV, TXT, images
- Max size: 100MB per file
- Duplicate detection via SHA256 hash
- MIME type validation

#### Upload Progress
Real-time progress tracking for each file:
- Upload speed
- Estimated time remaining
- Percentage complete
- Retry on failure
- Skip duplicates

#### UI Components

**FileUploadManager** (`components/FileUploadManager.tsx`)
- Drag-drop zone with visual feedback
- Click to browse
- Accepted file types display
- Bulk upload progress
- Upload queue with individual progress bars
- Files list with sorting/filtering
- File detail view with metadata
- Star/unstar toggle
- Download button

**UploadProgressCard**
- Filename display
- Progress bar (percentage)
- Upload speed
- Estimated time remaining
- Cancel/retry buttons

**FileDetailView**
- Filename and metadata
- AI summary (if available)
- Extracted text (if available)
- AI tags
- Linked items (project, site, contract)
- File preview (images/PDFs)
- Star toggle
- Download button
- Delete button

#### Pages
- `/dashboard/files` - Full file management interface

---

## PART 3: UNIFIED MEMORY + FILE SEARCH

### Overview
Unified search interface that searches across both memory entries and uploaded files simultaneously, with filtering by type, tags, and date.

### Key Features

#### Search Capabilities
1. **Full-text Search** - Search title, content, extracted text
2. **Type Filtering** - Filter by memory type or file type
3. **Tag Filtering** - Filter by custom tags
4. **Date Range** - Filter by creation date
5. **Sorting** - By relevance, pinned status, recency
6. **Results Integration** - Show both memory and files in single results view

#### Database Schema

**unified_search_index** table (optional, for optimization):
```
- id (UUID)
- user_id (UUID)
- source_type (text) - memory | file
- source_id (UUID) - Memory or document ID
- title (text)
- content_preview (text) - First 200 chars
- searchable_text (text) - Full text for search
- created_at (timestamp)
- updated_at (timestamp)
```

#### API Routes

```
GET    /api/search/unified            - Search across memory + files
```

Query Parameters:
- `q` - Search query (required, min 2 chars)
- `sourceType` - memory | file | all (default: all)
- `tags` - Filter by tags (comma-separated)
- `limit` - Result limit (default: 50)

Response:
```json
{
  "results": [
    {
      "id": "uuid",
      "type": "memory|file",
      "title": "string",
      "preview": "string",
      "tags": ["string"],
      "createdAt": "ISO8601",
      "memoryType": "global|site|project|contact",
      "fileType": "pdf|doc|...",
      "fileSize": 1024,
      "isPinned": true,
      "isStarred": true
    }
  ],
  "total": 42,
  "query": "search term"
}
```

#### UI Components

**UnifiedSearch** (`components/UnifiedSearch.tsx`)
- Large search input field
- Source type filter buttons (All, Memories, Files)
- Real-time search results
- Color-coded result cards by type
- Result preview with truncation
- File size display (for files)
- Pin/star indicators
- Creation date display
- Tag display

**SearchResultCard**
- Type indicator icon
- Title and preview
- Metadata (type, size, date, tags)
- Pin/star badges
- Click to view detail

#### Pages
- `/dashboard/search` - Unified search interface

---

## AI INTEGRATION (`lib/ai-context.ts`)

### Context Functions

The AI context layer provides intelligent memory and file access for AI operations:

#### Core Functions

**getSiteMemoryContext(userId, siteId)**
- Returns all global + site-specific memories
- Used when AI analyzes site emails

**getSiteFileContext(userId, siteId)**
- Returns files linked to a site
- Used for document reference

**getContactMemory(userId, contactId)**
- Returns contact-specific memory
- Used when analyzing emails from specific senders

**getProjectMemory(userId, projectId)**
- Returns project-specific memory
- Used for project analysis

**getGlobalMemory(userId)**
- Returns user-wide procedures, preferences
- Applies to all AI operations

**getFullAIContext(userId, siteId?, projectId?, contactId?)**
- Complete context layer for AI session
- Loads all relevant memory + files
- Returns structured AIContextLayer object

#### Prompt Injection

**createAISystemPrompt(context)**
- Injects memory + files into Claude/API system prompt
- Tells AI how to use and reference sources
- Formats memory and files for readability

**formatMemoryForAI(memories)**
- Converts memory entries to readable format
- Includes type, title, content, tags, dates

**formatFilesForAI(files)**
- Converts files to readable format
- Includes summaries, extracted text, metadata

#### Access Tracking

**recordMemoryAccess(memoryId)**
- Records when AI references a memory
- Updates access_count and last_accessed_at
- Helps identify most-used memory entries

#### Search Integration

**searchContextForQuery(userId, query, limit)**
- Searches memory + files for relevant context
- Returns both memories and files matching query
- Used before responding to emails or commands

---

## IMPLEMENTATION CHECKLIST

### Database
- [x] Create memory_entries table
- [x] Create memory_tags table
- [x] Create memory_file_links table
- [x] Create documents_extended table
- [x] Create file_uploads table
- [x] Create file_folders table
- [x] Create document_folder_mapping table
- [x] Create unified_search_index table
- [x] Add all indexes
- [x] Enable RLS policies
- [x] Create helper functions/triggers

### API Routes
- [x] GET /api/memory (list with filters)
- [x] POST /api/memory (create)
- [x] GET /api/memory/[id] (detail)
- [x] PUT /api/memory/[id] (update)
- [x] DELETE /api/memory/[id] (delete)
- [x] POST /api/files/upload (single upload)
- [x] GET /api/files (list with filters)
- [x] GET /api/files/[id] (detail)
- [x] PUT /api/files/[id] (update metadata)
- [x] DELETE /api/files/[id] (delete)
- [x] GET /api/search/unified (search)

### UI Components
- [x] MemoryManager (full memory management)
- [x] MemoryDetailView (view/edit)
- [x] MemoryCreateForm (create new)
- [x] FileUploadManager (full file management)
- [x] FileDetailView (view/edit)
- [x] UnifiedSearch (search interface)
- [x] SearchResultCard (individual result)

### Pages
- [x] /dashboard/memory (memory page)
- [x] /dashboard/files (files page)
- [x] /dashboard/search (search page)

### AI Integration
- [x] AI context layer (lib/ai-context.ts)
- [x] Memory access functions
- [x] File context functions
- [x] Prompt injection utilities
- [x] Access tracking
- [x] Search integration

### Types & Models
- [x] Memory types (MemoryEntry, MemoryTag, etc.)
- [x] File types (Document, FileUpload, etc.)
- [x] Search types (UnifiedSearchResult, etc.)
- [x] AI types (AIContextLayer, SourcedResponse, etc.)

---

## USAGE EXAMPLES

### For Users

#### Create Site-Specific Memory
1. Go to `/dashboard/memory`
2. Select "Site Memory" from dropdown
3. Select hospital from second dropdown
4. Click "+ New Memory"
5. Add title (e.g., "HVAC Maintenance Schedule")
6. Add content with procedures, dates, contacts
7. Add tags (e.g., #hvac, #maintenance, #scheduled)
8. Click "Create Memory"

#### Upload Contract Document
1. Go to `/dashboard/files`
2. Drag-drop PDF or click to browse
3. File uploads with progress tracking
4. Once complete, click to view detail
5. AI summary is generated automatically
6. Link to project/site if needed
7. Star if important

#### Search Everything
1. Go to `/dashboard/search`
2. Type search query (e.g., "HVAC failure")
3. See results from memories AND files
4. Filter by type (Memories / Files)
5. Click result to view full entry

### For AI Systems

#### Get Site Context Before Email Analysis
```typescript
// Before analyzing email for a site
const context = await getFullAIContext(userId, siteId)
const systemPrompt = createAISystemPrompt(context)

// Use systemPrompt in Claude/API call
const response = await claude.messages.create({
  system: systemPrompt,
  messages: [...],
})
```

#### Reference Memory in Response
```typescript
// When responding to user
const response = {
  answer: "Based on your saved memory, ...",
  sources: {
    memoryIds: ["mem-id-1", "mem-id-2"],
    fileIds: ["file-id-1"],
  },
}
```

#### Search for Context
```typescript
// Before responding to query
const context = await searchContextForQuery(userId, query)
const memories = context.memories
const files = context.files
// Use in analysis...
```

---

## SECURITY & PERFORMANCE

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own data
- Secure API token verification
- Database policies enforce user isolation

### Performance Optimizations
- Indexes on user_id, memory_type, file_type, dates
- Full-text search indexes on content
- Pagination support (limit/offset)
- Caching-friendly API responses
- Lazy loading in UI components

### Duplicate Prevention
- SHA256 file hashing
- Automatic duplicate detection
- User feedback on duplicates
- Prevents storage waste

### File Security
- File type validation (whitelist)
- File size limits (100MB max)
- Storage path isolation by user
- Secure download endpoints

---

## FUTURE ENHANCEMENTS

1. **Memory Sharing** - Share specific memories with team members
2. **File Permissions** - Control who can access files
3. **Memory Versioning** - Track changes to memories
4. **AI Learning** - AI learns user preferences from memories
5. **Batch Operations** - Delete/tag multiple memories at once
6. **Memory Templates** - Pre-made templates for common memory types
7. **File Sync** - Sync files from cloud storage
8. **OCR Integration** - Better image text extraction
9. **Memory Suggestions** - AI suggests memory entries to create
10. **Search Analytics** - Track most-searched terms

---

## TROUBLESHOOTING

### File Upload Fails
- Check file size (max 100MB)
- Verify file type is allowed
- Check Supabase storage bucket exists
- Check auth token is valid

### Memory Search Empty
- Verify memory entries exist
- Check memory_type filter
- Ensure search term is 2+ chars
- Check RLS policies allow access

### AI Context Empty
- Verify user has memory entries
- Check site/project IDs are correct
- Ensure RLS allows user access
- Verify memories not archived

---

## SUPPORT & INTEGRATION

For integration with existing EXECOS Pro features:

1. **Email Analysis** - Use AI context functions before analyzing
2. **Command Center** - Reference memory when answering queries
3. **Dashboard** - Show memory/file count in widgets
4. **Calendar** - Link calendar events to memory entries
5. **Contacts** - Link contact memory to contact profiles

See `CLAUDE_INTEGRATION.md` for Claude API integration examples.
