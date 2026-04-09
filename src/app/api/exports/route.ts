import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { enqueueExport } from "@/lib/queue";
import { validateSession } from "@/lib/hcp-api";

// POST /api/exports — Create a new export job
export async function POST(req: NextRequest) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionCookie, csrfToken } = await req.json();

    if (!sessionCookie) {
      return NextResponse.json(
        { error: "HCP session cookie is required" },
        { status: 400 }
      );
    }

    // Validate the session works
    const valid = await validateSession({
      cookie: sessionCookie,
      csrfToken: csrfToken || null,
    });
    if (!valid) {
      return NextResponse.json(
        { error: "HCP session is invalid or expired. Please recapture." },
        { status: 400 }
      );
    }

    const db = getServiceClient();

    // Check for existing pending/active export for this user
    const { data: activeExport } = await db
      .from("exports")
      .select("id, status")
      .eq("user_id", user.userId)
      .in("status", ["pending", "scanning", "scan_complete", "downloading", "zipping"])
      .single();

    if (activeExport) {
      return NextResponse.json(
        {
          error: "You already have an active export",
          exportId: activeExport.id,
        },
        { status: 409 }
      );
    }

    // Create export record
    const { data: exportRec, error } = await db
      .from("exports")
      .insert({
        user_id: user.userId,
        hcp_session_cookie: sessionCookie,
        hcp_csrf_token: csrfToken || null,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) throw error;

    // Enqueue the job
    await enqueueExport({
      exportId: exportRec.id,
      userId: user.userId,
      sessionCookie,
      csrfToken: csrfToken || null,
    });

    return NextResponse.json({ exportId: exportRec.id, status: "pending" });
  } catch (e: any) {
    console.error("Create export error:", e);
    return NextResponse.json(
      { error: "Failed to create export" },
      { status: 500 }
    );
  }
}

// GET /api/exports — List user's exports
export async function GET(req: NextRequest) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getServiceClient();
    const { data: exports, error } = await db
      .from("exports")
      .select(
        "id, status, total_customers, total_files, estimated_bytes, files_downloaded, files_errored, bytes_downloaded, customers_completed, customers_with_attachments, current_customer_name, current_file_name, error_message, started_at, scan_completed_at, completed_at, created_at"
      )
      .eq("user_id", user.userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    return NextResponse.json({ exports: exports || [] });
  } catch (e: any) {
    console.error("List exports error:", e);
    return NextResponse.json(
      { error: "Failed to list exports" },
      { status: 500 }
    );
  }
}
