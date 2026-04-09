import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/db";
import { hashPassword, createToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, companyName } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    if (!companyName || !companyName.trim()) {
      return NextResponse.json(
        { error: "HouseCallPro company name is required" },
        { status: 400 }
      );
    }

    const db = getServiceClient();

    const { data: existing } = await db
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const { data: user, error } = await db
      .from("users")
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        name: name || null,
        company_name: companyName.trim(),
      })
      .select("id, email, name, company_name")
      .single();

    if (error) throw error;

    const token = createToken({ userId: user.id, email: user.email });
    setAuthCookie(token);

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, companyName: user.company_name },
    });
  } catch (e: any) {
    console.error("Signup error:", e);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
