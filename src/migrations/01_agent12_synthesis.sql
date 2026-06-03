-- Supabase migration for Agent 12: Data Synthesis
-- Creates tables for synthesis archives, queries, and processing jobs

-- Create enum type for job status
CREATE TYPE synthesis_job_status AS ENUM ('pending', 'processing', 'complete', 'failed');

-- Table 1: synthesis_archives
-- Stores weekly synthesis summaries and analysis results
CREATE TABLE synthesis_archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  title TEXT NOT NULL,
  summary_content TEXT,
  source_stats JSONB DEFAULT '{}'::jsonb,
  key_findings TEXT[] DEFAULT ARRAY[]::TEXT[],
  risks_identified TEXT[] DEFAULT ARRAY[]::TEXT[],
  actors_mentioned TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 2: synthesis_queries
-- Stores ad-hoc questions and answers about synthesized data
CREATE TABLE synthesis_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  synthesis_id UUID NOT NULL REFERENCES synthesis_archives(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 3: synthesis_jobs
-- Tracks asynchronous synthesis processing jobs
CREATE TABLE synthesis_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status synthesis_job_status DEFAULT 'pending'::synthesis_job_status,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for query performance
CREATE INDEX synthesis_archives_user_id_idx ON synthesis_archives(user_id);
CREATE INDEX synthesis_archives_created_at_idx ON synthesis_archives(created_at);
CREATE INDEX synthesis_archives_week_start_idx ON synthesis_archives(week_start);

CREATE INDEX synthesis_queries_user_id_idx ON synthesis_queries(user_id);
CREATE INDEX synthesis_queries_synthesis_id_idx ON synthesis_queries(synthesis_id);
CREATE INDEX synthesis_queries_created_at_idx ON synthesis_queries(created_at);

CREATE INDEX synthesis_jobs_user_id_idx ON synthesis_jobs(user_id);
CREATE INDEX synthesis_jobs_created_at_idx ON synthesis_jobs(created_at);

-- Enable Row Level Security
ALTER TABLE synthesis_archives ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthesis_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthesis_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for synthesis_archives
CREATE POLICY "Users can view their own synthesis archives"
  ON synthesis_archives
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own synthesis archives"
  ON synthesis_archives
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own synthesis archives"
  ON synthesis_archives
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own synthesis archives"
  ON synthesis_archives
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for synthesis_queries
CREATE POLICY "Users can view their own synthesis queries"
  ON synthesis_queries
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own synthesis queries"
  ON synthesis_queries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own synthesis queries"
  ON synthesis_queries
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own synthesis queries"
  ON synthesis_queries
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for synthesis_jobs
CREATE POLICY "Users can view their own synthesis jobs"
  ON synthesis_jobs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own synthesis jobs"
  ON synthesis_jobs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own synthesis jobs"
  ON synthesis_jobs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own synthesis jobs"
  ON synthesis_jobs
  FOR DELETE
  USING (auth.uid() = user_id);
