import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getDownloadUrl } from "@/lib/s3";

// GET /api/exports/[id] — Get export details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getServiceClient();
    const { data: exportRec, error } = await db
      .from("exports")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.userId)
      .single();

    if (error || !exportRec) {
      return NextResponse.json({ error: "Export not found" }, { status: 404 });
    }

    // Generate fresh download URLs if export is complete
    let downloadUrls: Record<string, string> = {};
    if (exportRec.status === "complete") {
      if (exportRec.s3_csv_key) {
        downloadUrls.csv = await getDownloadUrl(exportRec.s3_csv_key);
      }
      if (exportRec.s3_xlsx_key) {
        downloadUrls.xlsx = await getDownloadUrl(exportRec.s3_xlsx_key);
      }
    }

    // Get customer summary
    const { data: customers } = await db
      .from("export_customers")
      .select(
        "hcp_customer_id, customer_name, total_files, files_downloaded, files_errored, bytes_downloaded, status"
      )
      .eq("export_id", params.id)
      .order("customer_name");

    // Strip sensitive data before sending to client
    const {
      hcp_session_cookie,
      hcp_csrf_token,
      ...safeExport
    } = exportRec;

    return NextResponse.json({
      export: safeExport,
      customers: customers || [],
      downloadUrls,
    });
  } catch (e: any) {
    console.error("Get export error:", e);
    return NextResponse.json(
      { error: "Failed to get export" },
      { status: 500 }
    );
  }
}
