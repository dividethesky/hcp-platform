-- ============================================
-- HCP Attachment Exporter — Database Schema
-- ============================================
-- Run this against your Supabase Postgres instance

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Export jobs table
CREATE TABLE exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- HCP session data (encrypted at rest by Supabase)
  hcp_session_cookie TEXT NOT NULL,
  hcp_csrf_token TEXT,
  
  -- Job status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'scanning', 'scan_complete', 'downloading', 'zipping', 'complete', 'failed', 'paused', 'cancelled')),
  
  -- Scan results (populated after Phase 1)
  total_customers INTEGER,
  total_files INTEGER,
  estimated_bytes BIGINT,
  customers_with_attachments INTEGER,
  
  -- Download progress (updated during Phase 3)
  files_downloaded INTEGER DEFAULT 0,
  files_errored INTEGER DEFAULT 0,
  bytes_downloaded BIGINT DEFAULT 0,
  customers_completed INTEGER DEFAULT 0,
  current_customer_name TEXT,
  current_file_name TEXT,
  
  -- Completion data
  s3_key TEXT,                    -- S3 path to the final export
  s3_csv_key TEXT,                -- S3 path to CSV log
  s3_xlsx_key TEXT,               -- S3 path to Excel log
  download_url TEXT,              -- Pre-signed URL (generated on demand)
  download_expires_at TIMESTAMPTZ,
  
  -- Error handling
  error_message TEXT,
  last_completed_customer_id TEXT, -- For resume capability
  
  -- Timing
  started_at TIMESTAMPTZ,
  scan_completed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Per-customer progress tracking (for resume and detailed reporting)
CREATE TABLE export_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_id UUID NOT NULL REFERENCES exports(id) ON DELETE CASCADE,
  
  hcp_customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  
  total_files INTEGER DEFAULT 0,
  files_downloaded INTEGER DEFAULT 0,
  files_errored INTEGER DEFAULT 0,
  bytes_downloaded BIGINT DEFAULT 0,
  
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'downloading', 'complete', 'partial', 'failed')),
  
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(export_id, hcp_customer_id)
);

-- Individual file log (for the Excel/CSV export)
CREATE TABLE export_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_id UUID NOT NULL REFERENCES exports(id) ON DELETE CASCADE,
  export_customer_id UUID REFERENCES export_customers(id) ON DELETE CASCADE,
  
  hcp_customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  hcp_attachment_id TEXT,
  file_name TEXT NOT NULL,
  
  -- Linked record IDs
  attachable_type TEXT,           -- Job, Estimate, Equipment, Customer
  attachable_id TEXT,
  job_id TEXT,
  estimate_id TEXT,
  equipment_id TEXT,
  
  -- Download result
  file_size BIGINT,
  s3_key TEXT,                    -- Individual file S3 path
  file_path TEXT,                 -- Path within the export folder structure
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'downloading', 'success', 'error')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_exports_user_id ON exports(user_id);
CREATE INDEX idx_exports_status ON exports(status);
CREATE INDEX idx_export_customers_export_id ON export_customers(export_id);
CREATE INDEX idx_export_customers_status ON export_customers(export_id, status);
CREATE INDEX idx_export_files_export_id ON export_files(export_id);
CREATE INDEX idx_export_files_customer_id ON export_files(export_customer_id);
CREATE INDEX idx_export_files_status ON export_files(export_id, status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER exports_updated_at BEFORE UPDATE ON exports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security (Supabase)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_files ENABLE ROW LEVEL SECURITY;
