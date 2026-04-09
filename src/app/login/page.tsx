"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
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
              Welcome Back
            </span>
          </div>

          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            Log in
          </h1>
          <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
            Sign in to your account to manage exports.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
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
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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
              disabled={loading || !email || !password}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                boxShadow: "0 4px 20px rgba(79,70,229,0.3)",
              }}
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          <p className="text-center text-xs mt-6" style={{ color: "var(--text-muted)" }}>
            Don't have an account?{" "}
            <Link href="/signup" className="text-indigo-400 underline underline-offset-2">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
