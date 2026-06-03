-- EXECOS Pro Database Extensions - Memory & File Management
-- This file extends the main database.sql with memory and file management tables
-- Execute after main schema

-- ============================================================================
-- PART 1: MEMORY MANAGEMENT TABLES
-- ============================================================================

-- Memory entries table - stores all memory entries (global, site, project, contact)
CREATE TABLE IF NOT EXISTS public.memory_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL CHECK (memory_type IN ('global', 'site', 'project', 'contact')),
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags JSONB DEFAULT '[]'::JSONB,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  access_count INTEGER DEFAULT 0
);

-- Memory tags table - organized tags for categorization
CREATE TABLE IF NOT EXISTS public.memory_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  tag_color TEXT DEFAULT '#3b82f6',
  memory_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tag_name)
);

-- Memory file links - attach files to memory entries
CREATE TABLE IF NOT EXISTS public.memory_file_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  memory_id UUID NOT NULL REFERENCES public.memory_entries(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(memory_id, file_id)
);

-- ============================================================================
-- PART 2: FILE UPLOAD & MANAGEMENT TABLES
-- ============================================================================

-- Documents table extension - enhanced with AI analysis and metadata
CREATE TABLE IF NOT EXISTS public.documents_extended (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'doc', 'docx', 'xlsx', 'xls', 'csv', 'txt', 'image', 'jpg', 'png', 'gif', 'other')),
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_hash TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  linked_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  linked_site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
  linked_contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  extracted_text TEXT,
  ai_summary TEXT,
  ai_tags JSONB DEFAULT '[]'::JSONB,
  is_starred BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File upload tracking - for progress and bulk uploads
CREATE TABLE IF NOT EXISTS public.file_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  status TEXT DEFAULT 'uploading' CHECK (status IN ('uploading', 'completed', 'failed')),
  progress_percent INTEGER DEFAULT 0,
  file_size INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- File folders/categories
CREATE TABLE IF NOT EXISTS public.file_folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
  folder_name TEXT NOT NULL,
  folder_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File to folder mapping
CREATE TABLE IF NOT EXISTS public.document_folder_mapping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES public.documents_extended(id) ON DELETE CASCADE,
  folder_id UUID NOT NULL REFERENCES public.file_folders(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(document_id, folder_id)
);

-- ============================================================================
-- PART 3: MEMORY + FILE INTEGRATION TABLES
-- ============================================================================

-- Search index for unified memory + file search
CREATE TABLE IF NOT EXISTS public.unified_search_index (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('memory', 'file')),
  source_id UUID NOT NULL,
  title TEXT,
  content_preview TEXT,
  searchable_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Memory indexes
CREATE INDEX IF NOT EXISTS idx_memory_entries_user_id ON public.memory_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_entries_memory_type ON public.memory_entries(memory_type);
CREATE INDEX IF NOT EXISTS idx_memory_entries_site_id ON public.memory_entries(site_id);
CREATE INDEX IF NOT EXISTS idx_memory_entries_project_id ON public.memory_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_memory_entries_contact_id ON public.memory_entries(contact_id);
CREATE INDEX IF NOT EXISTS idx_memory_entries_is_pinned ON public.memory_entries(is_pinned);
CREATE INDEX IF NOT EXISTS idx_memory_entries_created_at ON public.memory_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_memory_tags_user_id ON public.memory_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_file_links_memory_id ON public.memory_file_links(memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_file_links_file_id ON public.memory_file_links(file_id);

-- File indexes
CREATE INDEX IF NOT EXISTS idx_documents_extended_user_id ON public.documents_extended(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_extended_file_type ON public.documents_extended(file_type);
CREATE INDEX IF NOT EXISTS idx_documents_extended_linked_site_id ON public.documents_extended(linked_site_id);
CREATE INDEX IF NOT EXISTS idx_documents_extended_linked_project_id ON public.documents_extended(linked_project_id);
CREATE INDEX IF NOT EXISTS idx_documents_extended_is_starred ON public.documents_extended(is_starred);
CREATE INDEX IF NOT EXISTS idx_documents_extended_uploaded_at ON public.documents_extended(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON public.file_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_status ON public.file_uploads(status);
CREATE INDEX IF NOT EXISTS idx_file_folders_user_id ON public.file_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_file_folders_site_id ON public.file_folders(site_id);
CREATE INDEX IF NOT EXISTS idx_document_folder_mapping_document_id ON public.document_folder_mapping(document_id);
CREATE INDEX IF NOT EXISTS idx_document_folder_mapping_folder_id ON public.document_folder_mapping(folder_id);

-- Search index
CREATE INDEX IF NOT EXISTS idx_unified_search_index_user_id ON public.unified_search_index(user_id);
CREATE INDEX IF NOT EXISTS idx_unified_search_index_source_type ON public.unified_search_index(source_type);
CREATE INDEX IF NOT EXISTS idx_unified_search_index_source_id ON public.unified_search_index(source_id);

-- Full text search on memory content
CREATE INDEX IF NOT EXISTS idx_memory_entries_content_search ON public.memory_entries USING GIN (to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_memory_entries_title_search ON public.memory_entries USING GIN (to_tsvector('english', title));

-- Full text search on file extracted text
CREATE INDEX IF NOT EXISTS idx_documents_extracted_text_search ON public.documents_extended USING GIN (to_tsvector('english', extracted_text));

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.memory_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_file_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents_extended ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_folder_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unified_search_index ENABLE ROW LEVEL SECURITY;

-- RLS Policies for memory entries
CREATE POLICY "Users can view their own memory entries"
ON public.memory_entries FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memory entries"
ON public.memory_entries FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memory entries"
ON public.memory_entries FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memory entries"
ON public.memory_entries FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for memory tags
CREATE POLICY "Users can view their own tags"
ON public.memory_tags FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tags"
ON public.memory_tags FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
ON public.memory_tags FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for documents
CREATE POLICY "Users can view their own documents"
ON public.documents_extended FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
ON public.documents_extended FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
ON public.documents_extended FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
ON public.documents_extended FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for file uploads
CREATE POLICY "Users can view their own file uploads"
ON public.file_uploads FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own file uploads"
ON public.file_uploads FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own file uploads"
ON public.file_uploads FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for file folders
CREATE POLICY "Users can view their own folders"
ON public.file_folders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own folders"
ON public.file_folders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders"
ON public.file_folders FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders"
ON public.file_folders FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update memory access tracking
CREATE OR REPLACE FUNCTION update_memory_access()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_accessed_at = NOW();
  NEW.access_count = NEW.access_count + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for memory access tracking
CREATE TRIGGER update_memory_access_trigger
BEFORE UPDATE ON public.memory_entries
FOR EACH ROW
EXECUTE FUNCTION update_memory_access();

-- Function to increment memory tag count
CREATE OR REPLACE FUNCTION increment_tag_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.memory_tags
  SET memory_count = memory_count + 1
  WHERE id = ANY(NEW.tags);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for tag count increment
CREATE TRIGGER increment_tag_count_trigger
AFTER INSERT ON public.memory_entries
FOR EACH ROW
EXECUTE FUNCTION increment_tag_count();
