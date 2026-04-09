import { NextResponse } from "next/server";
import { getCurrentUser, createToken } from "@/lib/auth";

// GET /api/auth/token — Returns a fresh JWT for embedding in the bookmarklet
export async function GET() {
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Create a fresh token for the bookmarklet
  const token = createToken({ userId: user.userId, email: user.email });

  return NextResponse.json({ token });
}
