"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface ExportRecord {
  id: string;
  status: string;
  total_customers: number | null;
  total_files: number | null;
  estimated_bytes: number | null;
  files_downloaded: number;
  files_errored: number;
  bytes_downloaded: number;
  customers_completed: number;
  customers_with_attachments: number | null;
  current_customer_name: string | null;
  current_file_name: string | null;
  error_message: string | null;
  started_at: string | null;
  scan_completed_at: string | null;
  completed_at: string | null;
  created_at: string;
}

function fmtBytes(b: number): string {
  if (b < 1024) return b + " B";
  if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
  if (b < 1073741824) return (b / 1048576).toFixed(1) + " MB";
  return (b / 1073741824).toFixed(2) + " GB";
}

function statusColor(status: string): string {
  switch (status) {
    case "complete": return "var(--success)";
    case "failed": return "var(--error)";
    case "scanning": case "downloading": case "zipping": return "var(--accent)";
    default: return "var(--text-muted)";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "pending": return "Queued";
    case "scanning": return "Scanning...";
    case "downloading": return "Downloading...";
    case "zipping": return "Generating reports...";
    case "complete": return "Complete";
    case "failed": return "Failed";
    default: return status;
  }
}

// Build a simple bookmarklet that:
// 1. Checks we're on HCP
// 2. Calls /api/v2/organization to get the company name
// 3. Sends it to our server to verify
// 4. If verified, loads the standalone export script from GitHub Pages
function buildBookmarklet(apiBase: string, token: string): string {
  return [
    "javascript:void(function(){",
    "if(location.hostname.indexOf('housecallpro.com')<0){alert('Go to pro.housecallpro.com first');return}",
    "document.title='Verifying account...';",
    "fetch('/api/v2/organization',{credentials:'include',headers:{accept:'application/json'}})",
    ".then(function(r){return r.json()})",
    ".then(function(org){",
    "return fetch('" + apiBase + "/api/webhooks/session',{method:'POST',headers:{'Content-Type':'application/json'},",
    "body:JSON.stringify({token:'" + token + "',action:'verify',hcpCompanyName:org.company_name})})",
    "})",
    ".then(function(r){return r.json()})",
    ".then(function(d){",
    "document.title='HouseCallPro';",
    "if(d.success&&d.verified){",
    "var s=document.createElement('script');",
    "s.src='https://dividethesky.github.io/hcp-export/hcp_bookmarklet.js?t='+Date.now();",
    "document.head.appendChild(s)",
    "}else{alert(d.error||'Verification failed')}",
    "})",
    ".catch(function(e){document.title='HouseCallPro';alert('Error: '+e.message)})",
    "})()",
  ].join("");
}

export default function DashboardPage() {
  const router = useRouter();
  const [exports, setExports] = useState<ExportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkletCopied, setBookmarkletCopied] = useState(false);
  const [userToken, setUserToken] = useState<string>("");

  useEffect(() => {
    fetch("/api/auth/token")
      .then((r) => {
        if (r.status === 401) { router.push("/login"); return null; }
        return r.json();
      })
      .then((d) => { if (d?.token) setUserToken(d.token); })
      .catch(() => {});
  }, [router]);

  const fetchExports = useCallback(async () => {
    try {
      const res = await fetch("/api/exports");
      if (res.status === 401) { router.push("/login"); return; }
      const data = await res.json();
      setExports(data.exports || []);
    } catch { /* retry silently */ }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => {
    fetchExports();
    const interval = setInterval(fetchExports, 3000);
    return () => clearInterval(interval);
  }, [fetchExports]);

  const activeExport = exports.find((e) =>
    ["pending", "scanning", "scan_complete", "downloading", "zipping"].includes(e.status)
  );

  const completedExports = exports.filter((e) =>
    ["complete", "failed", "cancelled"].includes(e.status)
  );

  const apiBase = typeof window !== "undefined" ? window.location.origin : "";
  const bookmarkletCode = userToken ? buildBookmarklet(apiBase, userToken) : "";

  function copyBookmarklet() {
    navigator.clipboard.writeText(bookmarkletCode);
    setBookmarkletCopied(true);
    setTimeout(() => setBookmarkletCopied(false), 2500);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm" style={{ color: "var(--text-muted)" }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Dashboard</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Manage your HouseCallPro exports</p>
          </div>
          <button
            onClick={() => { fetch("/api/auth/logout", { method: "POST" }).then(() => router.push("/login")); }}
            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
          >
            Log out
          </button>
        </div>

        {/* Step 1: Bookmarklet */}
        <div className="rounded-2xl p-7 mb-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="flex items-start gap-5">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.15)" }}>
              1
            </div>
            <div className="flex-1">
              <h3 className="text-[15px] font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                {activeExport ? "Export in progress" : "Start a new export"}
              </h3>
              {!activeExport && userToken && (
                <>
                  <p className="text-[13px] mb-2" style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
                    Drag this button to your bookmarks bar, then go to{" "}
                    <a href="https://pro.housecallpro.com" target="_blank" rel="noopener" className="text-indigo-400 underline underline-offset-2">
                      pro.housecallpro.com
                    </a>
                    , log in, and click it.
                  </p>
                  <p className="text-[11px] mb-4" style={{ color: "var(--text-muted)", lineHeight: 1.5 }}>
                    The bookmarklet will verify your HCP company name matches your account, then run the export directly in your browser.
                  </p>
                  <div className="flex items-center flex-wrap gap-3 mb-3">
                    <a
                      href={bookmarkletCode}
                      onClick={(e) => e.preventDefault()}
                      draggable
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm text-white select-none"
                      style={{
                        background: "linear-gradient(135deg, #4338ca, #6366f1)",
                        cursor: "grab",
                        border: "2px solid rgba(99,102,241,0.3)",
                        boxShadow: "0 4px 20px rgba(79,70,229,0.25)",
                        textDecoration: "none",
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7,10 12,15 17,10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Export HCP Attachments
                    </a>
                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>← drag to bookmarks bar</span>
                  </div>
                  <button onClick={copyBookmarklet}
                    className="text-[11px] px-3 py-1.5 rounded-md transition-all"
                    style={{
                      background: bookmarkletCopied ? "rgba(16,185,129,0.1)" : "transparent",
                      border: `1px solid ${bookmarkletCopied ? "rgba(16,185,129,0.2)" : "var(--border)"}`,
                      color: bookmarkletCopied ? "var(--success)" : "var(--text-muted)",
                    }}>
                    {bookmarkletCopied ? "✓ Copied" : "Can't drag? Copy code →"}
                  </button>
                </>
              )}
              {!activeExport && !userToken && (
                <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Loading bookmarklet...</p>
              )}
            </div>
          </div>
        </div>

        {/* Active Export Progress */}
        {activeExport && (
          <div className="rounded-2xl p-7 mb-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
                Export Progress
              </h3>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ color: statusColor(activeExport.status), background: "rgba(99,102,241,0.1)" }}>
                {statusLabel(activeExport.status)}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
                <div className="text-[11px] mb-1" style={{ color: "var(--text-muted)" }}>Files</div>
                <div className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                  {activeExport.files_downloaded.toLocaleString()}
                </div>
              </div>
              <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
                <div className="text-[11px] mb-1" style={{ color: "var(--text-muted)" }}>Downloaded</div>
                <div className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                  {fmtBytes(activeExport.bytes_downloaded)}
                </div>
              </div>
              <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
                <div className="text-[11px] mb-1" style={{ color: "var(--text-muted)" }}>Customers</div>
                <div className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                  {activeExport.customers_completed}
                </div>
              </div>
              <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
                <div className="text-[11px] mb-1" style={{ color: "var(--text-muted)" }}>Errors</div>
                <div className="text-base font-bold" style={{ color: activeExport.files_errored > 0 ? "var(--error)" : "var(--success)" }}>
                  {activeExport.files_errored}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Export History */}
        {completedExports.length > 0 && (
          <div className="rounded-2xl p-7" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <h3 className="text-[15px] font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              Export History
            </h3>
            <div className="space-y-3">
              {completedExports.map((exp) => (
                <ExportHistoryRow key={exp.id} exp={exp} />
              ))}
            </div>
          </div>
        )}

        {!activeExport && completedExports.length === 0 && (
          <div className="text-center py-16">
            <div className="text-3xl mb-3">📂</div>
            <div className="text-sm" style={{ color: "var(--text-muted)" }}>
              No exports yet. Use the bookmarklet above to start your first export.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ExportHistoryRow({ exp }: { exp: ExportRecord }) {
  const [downloadUrls, setDownloadUrls] = useState<Record<string, string>>({});
  const [loadingUrls, setLoadingUrls] = useState(false);

  async function getDownloads() {
    setLoadingUrls(true);
    try {
      const res = await fetch(`/api/exports/${exp.id}`);
      const data = await res.json();
      setDownloadUrls(data.downloadUrls || {});
    } catch { /* */ }
    setLoadingUrls(false);
  }

  const date = new Date(exp.completed_at || exp.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });

  return (
    <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {exp.total_files?.toLocaleString() || "?"} files · {exp.customers_completed || "?"} customers
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
            style={{ color: statusColor(exp.status), background: "rgba(255,255,255,0.04)" }}>
            {exp.status}
          </span>
        </div>
        <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          {date} · {fmtBytes(exp.bytes_downloaded)}
          {exp.files_errored > 0 && <span style={{ color: "var(--error)" }}> · {exp.files_errored} errors</span>}
        </div>
      </div>

      {exp.status === "complete" && downloadUrls.xlsx && (
        <div className="flex gap-2">
          <a href={downloadUrls.xlsx} className="text-[11px] px-3 py-1.5 rounded-md font-medium"
            style={{ background: "rgba(99,102,241,0.1)", color: "var(--accent)" }}>
            Excel
          </a>
          <a href={downloadUrls.csv} className="text-[11px] px-3 py-1.5 rounded-md font-medium"
            style={{ background: "rgba(255,255,255,0.04)", color: "var(--text-secondary)" }}>
            CSV
          </a>
        </div>
      )}
    </div>
  );
}
