import { createClient } from "@supabase/supabase-js";

// Server-side client (uses service role key — full access, bypasses RLS)
export function getServiceClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

// Types matching our schema
export interface User {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
}

export interface Export {
  id: string;
  user_id: string;
  status:
    | "pending"
    | "scanning"
    | "scan_complete"
    | "downloading"
    | "zipping"
    | "complete"
    | "failed"
    | "paused"
    | "cancelled";
  hcp_session_cookie: string;
  hcp_csrf_token: string | null;
  total_customers: number | null;
  total_files: number | null;
  estimated_bytes: number | null;
  customers_with_attachments: number | null;
  files_downloaded: number;
  files_errored: number;
  bytes_downloaded: number;
  customers_completed: number;
  current_customer_name: string | null;
  current_file_name: string | null;
  s3_key: string | null;
  s3_csv_key: string | null;
  s3_xlsx_key: string | null;
  download_url: string | null;
  download_expires_at: string | null;
  error_message: string | null;
  last_completed_customer_id: string | null;
  started_at: string | null;
  scan_completed_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExportCustomer {
  id: string;
  export_id: string;
  hcp_customer_id: string;
  customer_name: string;
  total_files: number;
  files_downloaded: number;
  files_errored: number;
  bytes_downloaded: number;
  status: "pending" | "downloading" | "complete" | "partial" | "failed";
  completed_at: string | null;
}

export interface ExportFile {
  id: string;
  export_id: string;
  export_customer_id: string | null;
  hcp_customer_id: string;
  customer_name: string;
  hcp_attachment_id: string | null;
  file_name: string;
  attachable_type: string | null;
  attachable_id: string | null;
  job_id: string | null;
  estimate_id: string | null;
  equipment_id: string | null;
  file_size: number | null;
  s3_key: string | null;
  file_path: string | null;
  status: "pending" | "downloading" | "success" | "error";
  error_message: string | null;
  retry_count: number;
}
