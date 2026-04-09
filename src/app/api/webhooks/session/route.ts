import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

// POST /api/webhooks/session — Receives export results from the bookmarklet
// The bookmarklet sends: { token, hcpCompanyName, results }
// We verify the company name matches what's on file
export async function POST(req: NextRequest) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    const body = await req.json();
    const { token, hcpCompanyName, action } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication token required" },
        { status: 400, headers }
      );
    }

    // Verify the user token
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired token. Please log in again." },
        { status: 401, headers }
      );
    }

    const db = getServiceClient();

    // Get user's stored company name
    const { data: user } = await db
      .from("users")
      .select("id, company_name")
      .eq("id", payload.userId)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers }
      );
    }

    // Action: verify — bookmarklet checks company name before running
    if (action === "verify") {
      if (!hcpCompanyName) {
        return NextResponse.json(
          { error: "Could not read HCP company name" },
          { status: 400, headers }
        );
      }

      const storedName = (user.company_name || "").trim().toLowerCase();
      const hcpName = (hcpCompanyName || "").trim().toLowerCase();

      if (storedName !== hcpName) {
        return NextResponse.json(
          {
            success: false,
            error: "Company name mismatch. Your account is registered to \"" + user.company_name + "\" but this HCP account is \"" + hcpCompanyName + "\". Please contact support if this is incorrect.",
          },
          { status: 403, headers }
        );
      }

      return NextResponse.json(
        {
          success: true,
          verified: true,
          message: "Company verified: " + hcpCompanyName,
        },
        { headers }
      );
    }

    // Action: results — bookmarklet sends export results after completion
    if (action === "results") {
      const { summary, customerResults, fileCount, byteCount, errorCount, duration } = body;

      // Create an export record to track this
      const { data: exportRec, error: exportError } = await db
        .from("exports")
        .insert({
          user_id: payload.userId,
          hcp_session_cookie: "client-side-export",
          status: "complete",
          total_customers: summary?.totalCustomers || 0,
          total_files: fileCount || 0,
          estimated_bytes: byteCount || 0,
          customers_with_attachments: summary?.customersWithAttachments || 0,
          files_downloaded: (fileCount || 0) - (errorCount || 0),
          files_errored: errorCount || 0,
          bytes_downloaded: byteCount || 0,
          customers_completed: summary?.customersCompleted || 0,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (exportError) throw exportError;

      return NextResponse.json(
        {
          success: true,
          message: "Export results saved",
          exportId: exportRec.id,
          dashboard: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        },
        { headers }
      );
    }

    return NextResponse.json(
      { error: "Unknown action" },
      { status: 400, headers }
    );
  } catch (e: any) {
    console.error("Webhook error:", e);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500, headers }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
