// ============================================
// HouseCallPro Internal API Client
// ============================================

const HCP_BASE = "https://pro.housecallpro.com";

interface HCPSession {
  cookie: string;
  csrfToken: string | null;
}

interface HCPRequestOptions {
  session: HCPSession;
  path: string;
  params?: Record<string, string | number>;
}

async function hcpFetch({ session, path, params }: HCPRequestOptions): Promise<any> {
  const url = new URL(path, HCP_BASE);
  if (params) {
    for (const [key, val] of Object.entries(params)) {
      url.searchParams.set(key, String(val));
    }
  }

  const headers: Record<string, string> = {
    accept: "application/json",
    cookie: session.cookie,
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    referer: `${HCP_BASE}/app/customers/list`,
  };
  if (session.csrfToken) {
    headers["x-csrf-token"] = session.csrfToken;
  }

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) {
    throw new Error(`HCP API error: ${res.status} on ${path}`);
  }
  return res.json();
}

export async function keepAlive(session: HCPSession): Promise<boolean> {
  try {
    await hcpFetch({ session, path: "/api/v2/organization" });
    return true;
  } catch {
    return false;
  }
}

export async function validateSession(session: HCPSession): Promise<boolean> {
  return keepAlive(session);
}

// ── Customers ──────────────────────────────────

export interface HCPCustomer {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
}

interface CustomerPage {
  data: HCPCustomer[];
  total_count: number;
  total_pages_count: number;
  page: number;
}

export async function getCustomerPage(
  session: HCPSession,
  page: number,
  pageSize: number = 100
): Promise<CustomerPage> {
  return hcpFetch({
    session,
    path: "/alpha/customers",
    params: { page, page_size: pageSize, contractor: "false" },
  });
}

// ── Attachments ──────────────────────────────────

export interface HCPAttachment {
  id: string;
  file_name: string | null;
  file_file_name: string | null;
  file_file_size: number | null;
  file_content_type: string | null;
  attachable_type: string | null;
  attachable_id: string | number | null;
  attachable_uuid: string | null;
  customer_uuid: string | null;
  download_url: string | null;
  attachment_file_url: string | null;
}

interface AttachmentPage {
  data: HCPAttachment[];
  total_count: number;
  total_pages_count: number;
  page: number;
}

export async function getAttachmentPage(
  session: HCPSession,
  customerId: string,
  page: number,
  pageSize: number = 100
): Promise<AttachmentPage> {
  return hcpFetch({
    session,
    path: `/api/customers/${customerId}/attachments`,
    params: {
      page,
      page_size: pageSize,
      sort_by: "created_at",
      sort_direction: "desc",
      attachable_type: "",
    },
  });
}

// ── Jobs (for job number lookup) ──────────────────

export interface HCPJob {
  id: string;
  invoice_number: string | null;
  name: string | null;
  customer_id: string | null;
}

// Fetches all jobs for a customer and returns a map of job_uuid → {num, name}
// IMPORTANT: Uses parent_customer_uuid (not customer_id)
// Response is double-nested: { data: { data: [...jobs] }, total_page_count: N }
export async function getJobsForCustomer(
  session: HCPSession,
  customerUuid: string
): Promise<Map<string, { num: string; name: string }>> {
  const jobMap = new Map<string, { num: string; name: string }>();
  let page = 1;

  while (true) {
    try {
      const response = await hcpFetch({
        session,
        path: "/alpha/jobs",
        params: { page, page_size: 100, parent_customer_uuid: customerUuid },
      });

      // Double-nested: response.data is { object: "list", data: [...] }
      const wrapper = response.data || {};
      const jobs: HCPJob[] = Array.isArray(wrapper.data)
        ? wrapper.data
        : Array.isArray(wrapper)
        ? wrapper
        : [];

      for (const job of jobs) {
        jobMap.set(job.id, {
          num: job.invoice_number || "",
          name: job.name || "",
        });
      }

      // Pagination key is total_page_count (not total_pages_count)
      const totalPages = response.total_page_count || response.total_pages_count || 1;
      if (page >= totalPages) break;
      page++;
    } catch {
      break;
    }
  }

  return jobMap;
}

// ── File download ──────────────────────────────────

export async function downloadFile(
  url: string,
  maxRetries: number = 2
): Promise<{ buffer: Buffer; size: number }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return { buffer, size: buffer.length };
    } catch (e: any) {
      lastError = e;
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error("Download failed");
}

// ── Helpers ──────────────────────────────────

export function getCustomerName(customer: HCPCustomer): string {
  const name = [customer.first_name, customer.last_name].filter(Boolean).join(" ").trim();
  return name || customer.display_name || "Unknown";
}

export function getAttachmentDownloadUrl(att: HCPAttachment): string | null {
  return att.download_url || att.attachment_file_url || null;
}

export function safeFileName(name: string, maxLen: number = 60): string {
  return (name || "unnamed").replace(/[^a-zA-Z0-9 ._-]/g, "_").substring(0, maxLen);
}
