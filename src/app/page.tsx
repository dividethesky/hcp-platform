import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-content-center">
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-8 border"
          style={{ background: "rgba(99,102,241,0.08)", borderColor: "rgba(99,102,241,0.15)" }}>
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          <span className="text-[10px] font-semibold tracking-widest uppercase text-indigo-400">
            Data Migration Tool
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-5xl font-bold tracking-tight mb-6"
          style={{ color: "var(--text-primary)", lineHeight: 1.1 }}>
          Export your HouseCallPro<br />attachments in minutes
        </h1>

        <p className="text-lg mb-12 max-w-lg mx-auto" style={{ color: "var(--text-muted)", lineHeight: 1.7 }}>
          Bulk download every customer photo, document, and file from your
          HouseCallPro account. No software to install. Your data stays in your hands.
        </p>

        {/* CTAs */}
        <div className="flex items-center justify-center gap-4">
          <Link href="/signup"
            className="px-8 py-3.5 rounded-xl font-semibold text-white text-sm transition-all"
            style={{
              background: "linear-gradient(135deg, #4f46e5, #6366f1)",
              boxShadow: "0 4px 20px rgba(79,70,229,0.3)"
            }}>
            Get Started
          </Link>
          <Link href="/login"
            className="px-8 py-3.5 rounded-xl font-medium text-sm transition-all"
            style={{
              color: "var(--text-secondary)",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)"
            }}>
            Log In
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-6 mt-24 text-left">
          {[
            { icon: "⚡", title: "Parallel downloads", desc: "20 concurrent connections for maximum speed" },
            { icon: "🔒", title: "Your data, your control", desc: "Files go straight to secure cloud storage" },
            { icon: "📊", title: "Full audit trail", desc: "Excel report with Job, Estimate, and Equipment IDs" },
          ].map((f, i) => (
            <div key={i} className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="text-xl mb-3">{f.icon}</div>
              <div className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{f.title}</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
