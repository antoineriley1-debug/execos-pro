-- EXECOS Pro Intelligence Systems Extension
-- This file adds the four interconnected intelligence systems
-- Execute this after the base database.sql

-- ============================================================================
-- PART 1: EMAIL INFERENCE ENGINE TABLES
-- ============================================================================

-- Email Inferences table - Advanced email analysis with 13 inference points
CREATE TABLE IF NOT EXISTS public.email_inferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_id UUID NOT NULL REFERENCES public.emails(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  
  -- 13 Inference Points
  sender_intent TEXT,                           -- What is the sender trying to accomplish?
  hidden_urgency BOOLEAN DEFAULT FALSE,         -- Is this urgent despite tone?
  expected_response TEXT,                       -- Does this need a reply? What kind?
  actual_request TEXT,                          -- Strip the words, understand the underlying request
  action_items JSONB DEFAULT '[]'::JSONB,      -- Explicit and implicit action items
  missing_info JSONB DEFAULT '[]'::JSONB,      -- What details are absent?
  risk_level TEXT DEFAULT 'green' CHECK (risk_level IN ('green', 'yellow', 'red')),
  tone TEXT DEFAULT 'neutral' CHECK (tone IN ('professional', 'casual', 'frustrated', 'demanding', 'friendly', 'neutral')),
  deadline_pressure TEXT,                       -- Is this time-critical? When?
  related_sites JSONB DEFAULT '[]'::JSONB,     -- Array of site IDs
  related_projects JSONB DEFAULT '[]'::JSONB,  -- Array of project IDs
  related_contracts JSONB DEFAULT '[]'::JSONB, -- Array of contract IDs
  action_required TEXT DEFAULT 'none' CHECK (action_required IN ('none', 'reply', 'action', 'escalation', 'documentation')),
  sender_pattern_match TEXT,                    -- How does this compare to their normal communication?
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for email_inferences
CREATE INDEX IF NOT EXISTS idx_email_inferences_email_id ON public.email_inferences(email_id);
CREATE INDEX IF NOT EXISTS idx_email_inferences_site_id ON public.email_inferences(site_id);
CREATE INDEX IF NOT EXISTS idx_email_inferences_risk_level ON public.email_inferences(risk_level);
CREATE INDEX IF NOT EXISTS idx_email_inferences_action_required ON public.email_inferences(action_required);
CREATE INDEX IF NOT EXISTS idx_email_inferences_confidence ON public.email_inferences(confidence_score);

-- ============================================================================
-- PART 2: SENDER/RECEIVER LEARNING SYSTEM TABLES
-- ============================================================================

-- Contact Profiles table - Detailed sender/receiver communication patterns
CREATE TABLE IF NOT EXISTS public.contact_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  contact_email TEXT NOT NULL,  -- Email address for profile
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,  -- Link to contacts table if exists
  
  -- Communication Patterns
  communication_style TEXT CHECK (communication_style IN ('formal', 'casual', 'detailed', 'brief', 'mixed')),
  common_requests JSONB DEFAULT '[]'::JSONB,           -- What do they usually ask for?
  associated_sites JSONB DEFAULT '[]'::JSONB,          -- Which sites?
  associated_projects JSONB DEFAULT '[]'::JSONB,       -- Which projects?
  urgency_pattern TEXT,                                 -- Do they mark things urgent?
  response_expectations JSONB DEFAULT '{}'::JSONB,     -- Expected response format/timing
  reliability_score INTEGER CHECK (reliability_score >= 0 AND reliability_score <= 100),
  prior_commitments JSONB DEFAULT '[]'::JSONB,         -- What was promised? Status?
  preferred_tone TEXT CHECK (preferred_tone IN ('formal', 'casual', 'neutral')),
  pain_points JSONB DEFAULT '[]'::JSONB,               -- What topics trigger them?
  is_decision_maker BOOLEAN DEFAULT FALSE,
  avg_response_time_hours DECIMAL(10, 2),              -- How long do they take to respond?
  
  last_interacted_at TIMESTAMP WITH TIME ZONE,
  interaction_count INTEGER DEFAULT 0,
  notes TEXT,  -- Manual notes about contact
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for contact_profiles
CREATE INDEX IF NOT EXISTS idx_contact_profiles_site_id ON public.contact_profiles(site_id);
CREATE INDEX IF NOT EXISTS idx_contact_profiles_user_id ON public.contact_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_profiles_email ON public.contact_profiles(contact_email);
CREATE INDEX IF NOT EXISTS idx_contact_profiles_reliability ON public.contact_profiles(reliability_score);
CREATE INDEX IF NOT EXISTS idx_contact_profiles_last_interacted ON public.contact_profiles(last_interacted_at);

-- Sender Patterns table - Specific pattern detection with statistics
CREATE TABLE IF NOT EXISTS public.sender_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_profile_id UUID NOT NULL REFERENCES public.contact_profiles(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  
  pattern_type TEXT NOT NULL CHECK (pattern_type IN (
    'urgency_escalation',
    'slow_response',
    'needs_detail',
    'follows_up',
    'inconsistent_timing',
    'multi_email_threads',
    'deadline_focused',
    'detail_oriented',
    'quick_responder',
    'rarely_follows_up',
    'always_urgent',
    'decision_maker',
    'other'
  )),
  pattern_data JSONB DEFAULT '{}'::JSONB,  -- Statistics and metadata
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  
  last_observed_at TIMESTAMP WITH TIME ZONE,
  occurrences_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for sender_patterns
CREATE INDEX IF NOT EXISTS idx_sender_patterns_contact_profile ON public.sender_patterns(contact_profile_id);
CREATE INDEX IF NOT EXISTS idx_sender_patterns_site_id ON public.sender_patterns(site_id);
CREATE INDEX IF NOT EXISTS idx_sender_patterns_type ON public.sender_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_sender_patterns_confidence ON public.sender_patterns(confidence);

-- ============================================================================
-- PART 3: CALENDAR INTELLIGENCE SYSTEM TABLES
-- ============================================================================

-- Calendar Events table - Comprehensive event management
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  
  event_type TEXT DEFAULT 'meeting' CHECK (event_type IN (
    'meeting',
    'reminder',
    'deadline',
    'follow_up',
    'milestone',
    'renewal',
    'pm_date',
    'site_visit',
    'task'
  )),
  
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  location TEXT,
  attendees JSONB DEFAULT '[]'::JSONB,  -- Array of email/names
  
  all_day BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT,  -- RRULE format if recurring
  reminder_minutes_before INTEGER[] DEFAULT ARRAY[15, 60, 1440],
  
  -- Linked resources
  linked_email_id UUID REFERENCES public.emails(id) ON DELETE SET NULL,
  linked_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  linked_contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  linked_site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
  
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'overdue')),
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for calendar_events
CREATE INDEX IF NOT EXISTS idx_calendar_events_site_id ON public.calendar_events(site_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_datetime ON public.calendar_events(start_datetime);
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_type ON public.calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON public.calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_linked_email ON public.calendar_events(linked_email_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_linked_project ON public.calendar_events(linked_project_id);

-- Calendar Reminders table - Track reminder delivery
CREATE TABLE IF NOT EXISTS public.calendar_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('notification', 'email', 'sms')),
  reminder_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for calendar_reminders
CREATE INDEX IF NOT EXISTS idx_calendar_reminders_event_id ON public.calendar_reminders(event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_reminders_reminder_datetime ON public.calendar_reminders(reminder_datetime);
CREATE INDEX IF NOT EXISTS idx_calendar_reminders_sent ON public.calendar_reminders(sent);

-- Recurring Tasks table - Long-term recurring patterns
CREATE TABLE IF NOT EXISTS public.recurring_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  
  recurrence TEXT NOT NULL CHECK (recurrence IN ('daily', 'weekly', 'monthly', 'custom')),
  recurrence_pattern JSONB DEFAULT '{}'::JSONB,  -- days_of_week, date_of_month, etc.
  
  -- Link to resources
  linked_site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
  linked_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  
  enabled BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for recurring_tasks
CREATE INDEX IF NOT EXISTS idx_recurring_tasks_site_id ON public.recurring_tasks(site_id);
CREATE INDEX IF NOT EXISTS idx_recurring_tasks_user_id ON public.recurring_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_tasks_enabled ON public.recurring_tasks(enabled);

-- ============================================================================
-- PART 4: WORKFLOW INTELLIGENCE & COMMAND CENTER TABLES
-- ============================================================================

-- Workflow Patterns table - Learn what you do repeatedly
CREATE TABLE IF NOT EXISTS public.workflow_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  pattern_type TEXT NOT NULL CHECK (pattern_type IN (
    'daily_task',
    'recurring_task',
    'common_action',
    'decision_pattern',
    'communication_pattern',
    'escalation_pattern',
    'follow_up_pattern',
    'other'
  )),
  
  pattern_name TEXT NOT NULL,
  pattern_data JSONB DEFAULT '{}'::JSONB,  -- Flexible data structure
  frequency TEXT,  -- e.g. "every 3 days", "daily at 9am"
  
  last_occurred_at TIMESTAMP WITH TIME ZONE,
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for workflow_patterns
CREATE INDEX IF NOT EXISTS idx_workflow_patterns_user_id ON public.workflow_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_patterns_site_id ON public.workflow_patterns(site_id);
CREATE INDEX IF NOT EXISTS idx_workflow_patterns_type ON public.workflow_patterns(pattern_type);

-- Workflow Recommendations table - AI recommendations and tracking
CREATE TABLE IF NOT EXISTS public.workflow_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN (
    'follow_up',
    'risk_flag',
    'missing_action',
    'optimization',
    'escalation',
    'deadline_alert',
    'pattern_alert',
    'opportunity',
    'other'
  )),
  
  recommendation_text TEXT NOT NULL,
  reason TEXT,  -- Why was this recommended?
  related_items JSONB DEFAULT '{}'::JSONB,  -- {emails: [...], projects: [...], sites: [...]}
  
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'dismissed', 'completed', 'archived')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  dismissed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for workflow_recommendations
CREATE INDEX IF NOT EXISTS idx_workflow_recommendations_user_id ON public.workflow_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_recommendations_site_id ON public.workflow_recommendations(site_id);
CREATE INDEX IF NOT EXISTS idx_workflow_recommendations_status ON public.workflow_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_workflow_recommendations_priority ON public.workflow_recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_workflow_recommendations_created_at ON public.workflow_recommendations(created_at);

-- AI Observations table - Anomalies, patterns, opportunities
CREATE TABLE IF NOT EXISTS public.ai_observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  observation_text TEXT NOT NULL,
  observation_type TEXT NOT NULL CHECK (observation_type IN (
    'pattern',
    'anomaly',
    'opportunity',
    'risk',
    'insight',
    'trend',
    'other'
  )),
  
  related_data JSONB DEFAULT '{}'::JSONB,
  importance TEXT DEFAULT 'medium' CHECK (importance IN ('low', 'medium', 'high')),
  
  is_acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for ai_observations
CREATE INDEX IF NOT EXISTS idx_ai_observations_user_id ON public.ai_observations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_observations_site_id ON public.ai_observations(site_id);
CREATE INDEX IF NOT EXISTS idx_ai_observations_type ON public.ai_observations(observation_type);
CREATE INDEX IF NOT EXISTS idx_ai_observations_importance ON public.ai_observations(importance);
CREATE INDEX IF NOT EXISTS idx_ai_observations_timestamp ON public.ai_observations(timestamp);

-- ============================================================================
-- ENABLE RLS FOR NEW TABLES
-- ============================================================================

ALTER TABLE public.email_inferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sender_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_observations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================================================

-- email_inferences policies
CREATE POLICY "Users can view email inferences in their sites"
ON public.email_inferences FOR SELECT
USING (site_id IN (
  SELECT id FROM public.sites WHERE owner_id = auth.uid()
));

CREATE POLICY "Users can create email inferences in their sites"
ON public.email_inferences FOR INSERT
WITH CHECK (site_id IN (
  SELECT id FROM public.sites WHERE owner_id = auth.uid()
));

CREATE POLICY "Users can update email inferences in their sites"
ON public.email_inferences FOR UPDATE
USING (site_id IN (
  SELECT id FROM public.sites WHERE owner_id = auth.uid()
));

-- contact_profiles policies
CREATE POLICY "Users can view their contact profiles"
ON public.contact_profiles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their contact profiles"
ON public.contact_profiles FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their contact profiles"
ON public.contact_profiles FOR UPDATE
USING (user_id = auth.uid());

-- calendar_events policies
CREATE POLICY "Users can view calendar events in their sites"
ON public.calendar_events FOR SELECT
USING (site_id IN (
  SELECT id FROM public.sites WHERE owner_id = auth.uid()
));

CREATE POLICY "Users can create calendar events in their sites"
ON public.calendar_events FOR INSERT
WITH CHECK (site_id IN (
  SELECT id FROM public.sites WHERE owner_id = auth.uid()
));

CREATE POLICY "Users can update their calendar events"
ON public.calendar_events FOR UPDATE
USING (user_id = auth.uid());

-- workflow_recommendations policies
CREATE POLICY "Users can view their recommendations"
ON public.workflow_recommendations FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their recommendations"
ON public.workflow_recommendations FOR UPDATE
USING (user_id = auth.uid());

-- ai_observations policies
CREATE POLICY "Users can view their observations"
ON public.ai_observations FOR SELECT
USING (user_id = auth.uid());

-- Similar patterns for other tables would follow...

-- ============================================================================
-- AUDIT TRIGGERS (Optional but recommended)
-- ============================================================================

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs(site_id, user_id, action, resource_type, resource_id, changes)
  VALUES(
    COALESCE(NEW.site_id, OLD.site_id),
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW))
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Add audit triggers for critical tables
CREATE TRIGGER audit_email_inferences
AFTER INSERT OR UPDATE ON public.email_inferences
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_contact_profiles
AFTER INSERT OR UPDATE ON public.contact_profiles
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_calendar_events
AFTER INSERT OR UPDATE ON public.calendar_events
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_workflow_recommendations
AFTER INSERT OR UPDATE ON public.workflow_recommendations
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
