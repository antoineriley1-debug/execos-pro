-- Create enums
CREATE TYPE bulk_investigation_status AS ENUM ('pending', 'processing', 'analyzing', 'complete', 'failed');
CREATE TYPE investigation_file_status AS ENUM ('pending', 'analyzed', 'failed');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE sentiment_type AS ENUM ('negative', 'neutral', 'positive');

-- Create tables
CREATE TABLE bulk_investigations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_name text NOT NULL,
  status bulk_investigation_status NOT NULL DEFAULT 'pending',
  total_files integer NOT NULL DEFAULT 0,
  processed_files integer NOT NULL DEFAULT 0,
  error_message text,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE investigation_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bulk_investigation_id uuid NOT NULL REFERENCES bulk_investigations(id) ON DELETE CASCADE,
  original_filename text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  storage_path text NOT NULL,
  extracted_text text,
  parsed_metadata jsonb,
  status investigation_file_status NOT NULL DEFAULT 'pending',
  error text,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
  analyzed_at timestamp with time zone
);

CREATE TABLE investigation_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  investigation_file_id uuid NOT NULL REFERENCES investigation_files(id) ON DELETE CASCADE,
  key_findings text NOT NULL,
  risk_score integer NOT NULL CHECK (risk_score >= 1 AND risk_score <= 100),
  risk_level risk_level NOT NULL,
  entities_found jsonb,
  sentiment sentiment_type,
  tokens_used integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE investigation_aggregates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bulk_investigation_id uuid NOT NULL REFERENCES bulk_investigations(id) ON DELETE CASCADE,
  aggregate_summary text NOT NULL,
  common_themes text[],
  top_risks text[],
  all_entities jsonb,
  average_risk_score numeric,
  sentiment_distribution jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_bulk_investigations_user_id ON bulk_investigations(user_id);
CREATE INDEX idx_bulk_investigations_created_at ON bulk_investigations(created_at);
CREATE INDEX idx_bulk_investigations_status ON bulk_investigations(status);

CREATE INDEX idx_investigation_files_user_id ON investigation_files(user_id);
CREATE INDEX idx_investigation_files_bulk_investigation_id ON investigation_files(bulk_investigation_id);
CREATE INDEX idx_investigation_files_uploaded_at ON investigation_files(uploaded_at);
CREATE INDEX idx_investigation_files_status ON investigation_files(status);

CREATE INDEX idx_investigation_summaries_user_id ON investigation_summaries(user_id);
CREATE INDEX idx_investigation_summaries_investigation_file_id ON investigation_summaries(investigation_file_id);
CREATE INDEX idx_investigation_summaries_created_at ON investigation_summaries(created_at);

CREATE INDEX idx_investigation_aggregates_user_id ON investigation_aggregates(user_id);
CREATE INDEX idx_investigation_aggregates_bulk_investigation_id ON investigation_aggregates(bulk_investigation_id);
CREATE INDEX idx_investigation_aggregates_created_at ON investigation_aggregates(created_at);

-- Enable RLS
ALTER TABLE bulk_investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE investigation_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE investigation_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE investigation_aggregates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bulk_investigations
CREATE POLICY "Users can view their own bulk investigations"
  ON bulk_investigations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create bulk investigations"
  ON bulk_investigations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bulk investigations"
  ON bulk_investigations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bulk investigations"
  ON bulk_investigations FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for investigation_files
CREATE POLICY "Users can view their own investigation files"
  ON investigation_files FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create investigation files"
  ON investigation_files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investigation files"
  ON investigation_files FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investigation files"
  ON investigation_files FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for investigation_summaries
CREATE POLICY "Users can view their own investigation summaries"
  ON investigation_summaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create investigation summaries"
  ON investigation_summaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investigation summaries"
  ON investigation_summaries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investigation summaries"
  ON investigation_summaries FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for investigation_aggregates
CREATE POLICY "Users can view their own investigation aggregates"
  ON investigation_aggregates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create investigation aggregates"
  ON investigation_aggregates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investigation aggregates"
  ON investigation_aggregates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investigation aggregates"
  ON investigation_aggregates FOR DELETE
  USING (auth.uid() = user_id);

-- Storage bucket reference: Files stored in 'agent13-investigations' bucket
-- Storage paths follow: storage.objects bucket_id = 'agent13-investigations', path = user_id/bulk_investigation_id/filename
