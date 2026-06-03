-- EXECOS Pro Email Export System
-- Database schema for email exports and action tracking

-- ============================================================================
-- EMAIL EXPORTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.email_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email_id UUID REFERENCES public.emails(id) ON DELETE CASCADE,  -- NULL for batch exports
  email_ids JSONB DEFAULT '[]'::JSONB,  -- Array of email IDs for batch exports
  
  -- Export Details
  export_format TEXT NOT NULL CHECK (export_format IN ('pdf', 'docx', 'txt', 'json', 'csv', 'md', 'html')),
  export_file_url TEXT NOT NULL,  -- Supabase Storage URL
  file_name TEXT NOT NULL,
  file_size INTEGER,  -- in bytes
  
  -- Export Options
  include_attachments BOOLEAN DEFAULT FALSE,
  include_full_analysis BOOLEAN DEFAULT TRUE,
  include_response_template BOOLEAN DEFAULT TRUE,
  include_thread BOOLEAN DEFAULT FALSE,  -- Full conversation thread
  
  -- Export Type
  export_type TEXT DEFAULT 'single' CHECK (export_type IN ('single', 'batch', 'thread')),
  batch_count INTEGER,  -- Number of emails in batch export
  
  -- Metadata
  exported_by UUID NOT NULL REFERENCES public.users(id),
  export_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for email_exports
CREATE INDEX IF NOT EXISTS idx_email_exports_user_id ON public.email_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_email_exports_email_id ON public.email_exports(email_id);
CREATE INDEX IF NOT EXISTS idx_email_exports_export_format ON public.email_exports(export_format);
CREATE INDEX IF NOT EXISTS idx_email_exports_export_date ON public.email_exports(export_date);
CREATE INDEX IF NOT EXISTS idx_email_exports_export_type ON public.email_exports(export_type);

-- ============================================================================
-- EMAIL ACTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.email_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email_id UUID NOT NULL REFERENCES public.emails(id) ON DELETE CASCADE,
  
  -- Action Details
  action_type TEXT NOT NULL CHECK (action_type IN (
    'draft_response',
    'draft_escalation',
    'draft_summary',
    'create_task',
    'create_multiple_tasks',
    'add_to_task',
    'link_project',
    'create_project',
    'link_site',
    'link_contract',
    'add_contact',
    'update_vendor',
    'flag_vendor',
    'save_memory',
    'create_note',
    'archive',
    'flag_compliance',
    'escalate_risk',
    'create_policy_note',
    'schedule_followup'
  )),
  
  action_status TEXT DEFAULT 'pending' CHECK (action_status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  
  -- What was created/modified
  action_result JSONB DEFAULT '{}'::JSONB,  -- {taskId: '...', projectId: '...', etc.}
  action_summary TEXT,  -- Human-readable summary of what was done
  
  -- Response/Draft Content
  generated_content TEXT,  -- For draft responses
  response_tone TEXT CHECK (response_tone IN ('firm', 'friendly', 'escalation', 'executive_summary', NULL)),
  
  -- Suggested vs Executed
  was_suggested BOOLEAN DEFAULT TRUE,
  suggestion_confidence INTEGER CHECK (suggestion_confidence >= 0 AND suggestion_confidence <= 100),
  
  -- Timestamps
  suggested_at TIMESTAMP WITH TIME ZONE,
  executed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for email_actions
CREATE INDEX IF NOT EXISTS idx_email_actions_user_id ON public.email_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_email_actions_email_id ON public.email_actions(email_id);
CREATE INDEX IF NOT EXISTS idx_email_actions_action_type ON public.email_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_email_actions_action_status ON public.email_actions(action_status);
CREATE INDEX IF NOT EXISTS idx_email_actions_created_at ON public.email_actions(created_at);

-- ============================================================================
-- EMAIL ACTION SUGGESTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.email_action_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email_id UUID NOT NULL REFERENCES public.emails(id) ON DELETE CASCADE,
  
  -- Suggestion Details
  action_type TEXT NOT NULL,  -- Same as email_actions.action_type
  suggestion_text TEXT NOT NULL,
  reasoning TEXT NOT NULL,  -- Why this action is suggested
  
  -- Suggestion Scoring
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),  -- 1=highest
  
  -- Grouping
  suggestion_group TEXT,  -- e.g., "response_options", "task_options", "project_options"
  
  -- Status
  dismissed BOOLEAN DEFAULT FALSE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  executed BOOLEAN DEFAULT FALSE,
  executed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for email_action_suggestions
CREATE INDEX IF NOT EXISTS idx_action_suggestions_email_id ON public.email_action_suggestions(email_id);
CREATE INDEX IF NOT EXISTS idx_action_suggestions_user_id ON public.email_action_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_action_suggestions_confidence ON public.email_action_suggestions(confidence_score);
CREATE INDEX IF NOT EXISTS idx_action_suggestions_priority ON public.email_action_suggestions(priority);
CREATE INDEX IF NOT EXISTS idx_action_suggestions_dismissed ON public.email_action_suggestions(dismissed);
CREATE INDEX IF NOT EXISTS idx_action_suggestions_executed ON public.email_action_suggestions(executed);

-- ============================================================================
-- EMAIL RESPONSE TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.email_response_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Template Details
  template_name TEXT NOT NULL,
  template_description TEXT,
  template_category TEXT CHECK (template_category IN ('firm', 'friendly', 'escalation', 'executive_summary', 'other')),
  
  -- Template Content
  template_text TEXT NOT NULL,
  template_variables JSONB DEFAULT '[]'::JSONB,  -- Variables like {{senderName}}, {{actionItem}}
  
  -- Metadata
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for email_response_templates
CREATE INDEX IF NOT EXISTS idx_response_templates_user_id ON public.email_response_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_response_templates_category ON public.email_response_templates(template_category);

-- ============================================================================
-- BATCH EXPORT JOBS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.batch_export_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Job Details
  job_name TEXT NOT NULL,
  email_ids JSONB NOT NULL,  -- Array of email IDs to export
  export_format TEXT NOT NULL CHECK (export_format IN ('pdf', 'docx', 'txt', 'json', 'csv', 'md', 'html')),
  
  -- Options
  include_attachments BOOLEAN DEFAULT FALSE,
  include_full_analysis BOOLEAN DEFAULT TRUE,
  include_response_template BOOLEAN DEFAULT TRUE,
  separate_files BOOLEAN DEFAULT FALSE,  -- TRUE = zip with individual files, FALSE = single document
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  
  -- Output
  output_file_url TEXT,  -- Zip file URL when complete
  output_file_size INTEGER,
  error_message TEXT,
  
  -- Metadata
  total_emails INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for batch_export_jobs
CREATE INDEX IF NOT EXISTS idx_batch_export_jobs_user_id ON public.batch_export_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_batch_export_jobs_status ON public.batch_export_jobs(status);
CREATE INDEX IF NOT EXISTS idx_batch_export_jobs_created_at ON public.batch_export_jobs(created_at);

-- ============================================================================
-- ENABLE RLS FOR NEW TABLES
-- ============================================================================

ALTER TABLE public.email_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_action_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_response_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_export_jobs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- email_exports policies
CREATE POLICY "Users can view their email exports"
ON public.email_exports FOR SELECT
USING (user_id = auth.uid() OR exported_by = auth.uid());

CREATE POLICY "Users can create email exports"
ON public.email_exports FOR INSERT
WITH CHECK (user_id = auth.uid() OR exported_by = auth.uid());

CREATE POLICY "Users can delete their email exports"
ON public.email_exports FOR DELETE
USING (user_id = auth.uid());

-- email_actions policies
CREATE POLICY "Users can view their email actions"
ON public.email_actions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create email actions"
ON public.email_actions FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their email actions"
ON public.email_actions FOR UPDATE
USING (user_id = auth.uid());

-- email_action_suggestions policies
CREATE POLICY "Users can view their action suggestions"
ON public.email_action_suggestions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their action suggestions"
ON public.email_action_suggestions FOR UPDATE
USING (user_id = auth.uid());

-- email_response_templates policies
CREATE POLICY "Users can view their response templates"
ON public.email_response_templates FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create response templates"
ON public.email_response_templates FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their response templates"
ON public.email_response_templates FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their response templates"
ON public.email_response_templates FOR DELETE
USING (user_id = auth.uid());

-- batch_export_jobs policies
CREATE POLICY "Users can view their batch export jobs"
ON public.batch_export_jobs FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create batch export jobs"
ON public.batch_export_jobs FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their batch export jobs"
ON public.batch_export_jobs FOR UPDATE
USING (user_id = auth.uid());

-- ============================================================================
-- AUDIT TRIGGERS
-- ============================================================================

CREATE TRIGGER audit_email_exports
AFTER INSERT OR UPDATE ON public.email_exports
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_email_actions
AFTER INSERT OR UPDATE ON public.email_actions
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
