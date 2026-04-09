"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, companyName }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl p-10" style={{
          background: "linear-gradient(165deg, rgba(15,23,42,0.95), rgba(10,15,30,0.98))",
          border: "1px solid var(--border)",
          boxShadow: "0 40px 100px rgba(0,0,0,0.5)"
        }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6 border"
            style={{ background: "rgba(99,102,241,0.08)", borderColor: "rgba(99,102,241,0.15)" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span className="text-[10px] font-semibold tracking-widest uppercase text-indigo-400">
              Create Account
            </span>
          </div>

          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            Get started
          </h1>
          <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
            Create an account to export your HCP attachments.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            />

            {/* Company Name with help */}
            <div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="HouseCallPro company name (exact match)"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors pr-10"
                  style={{
                    background: "var(--bg-input)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowHelp(!showHelp)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: "rgba(99,102,241,0.15)",
                    color: "#818cf8",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  ?
                </button>
              </div>

              {showHelp && (
                <div className="mt-3 p-4 rounded-xl text-xs" style={{
                  background: "rgba(99,102,241,0.06)",
                  border: "1px solid rgba(99,102,241,0.12)",
                  color: "var(--text-secondary)",
                  lineHeight: 1.7,
                }}>
                  <div className="font-semibold mb-2" style={{ color: "#818cf8" }}>
                    Where to find your company name:
                  </div>
                  <div style={{ color: "var(--text-muted)" }}>
                    1. Log into <strong style={{ color: "var(--text-secondary)" }}>pro.housecallpro.com</strong><br/>
                    2. Click the <strong style={{ color: "var(--text-secondary)" }}>gear icon</strong> (Settings) in the bottom-left sidebar<br/>
                    3. Click <strong style={{ color: "var(--text-secondary)" }}>Company Profile</strong><br/>
                    4. Your company name is at the top of the page<br/><br/>
                    This must match <strong style={{ color: "#f59e0b" }}>exactly</strong> as it appears in HouseCallPro — including capitalization, spaces, and punctuation (e.g. <em>"Smith's Plumbing LLC"</em> not <em>"smiths plumbing"</em>).
                  </div>
                </div>
              )}
            </div>

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            />

            {error && (
              <p className="text-xs font-medium" style={{ color: "var(--error)" }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password || !companyName}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                boxShadow: "0 4px 20px rgba(79,70,229,0.3)",
              }}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-xs mt-6" style={{ color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-400 underline underline-offset-2">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
