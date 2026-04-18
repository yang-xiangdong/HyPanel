"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Shield } from "lucide-react";
import { Logo } from "../../components/logo";

const apiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleLogin() {
    setBusy(true);
    setStatus("正在验证...");

    try {
      const response = await fetch(`${apiBase}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        setStatus("登录失败，请检查邮箱和密码。");
        return;
      }

      const data = (await response.json()) as { token: string };
      window.localStorage.setItem("hypanel_admin_token", data.token);
      router.push("/admin/dashboard");
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full h-10 px-3 text-sm rounded-lg border border-[#262626] bg-[#0a0a0a] text-white placeholder:text-[#525252] focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-[#404040] transition-colors";

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <Logo size={44} dark />
          <h1 className="mt-3 text-xl font-semibold tracking-tight text-white">
            HyPanel
          </h1>
          <span className="mt-2 inline-flex items-center gap-1.5 h-6 px-2.5 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-white/8 text-white/50 border border-white/8">
            <Shield size={12} />
            Admin
          </span>
        </div>

        {/* Card */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6">
          {/* Status */}
          {status && (
            <div className="flex items-center gap-2 mb-5 text-sm text-[#a3a3a3]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] shrink-0" />
              <span>{status}</span>
            </div>
          )}

          <div className="space-y-3">
            <input
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="管理员邮箱"
            />
            <input
              className={inputClass}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="密码"
            />
            <button
              className="w-full h-10 bg-white text-[#0a0a0a] text-sm font-medium rounded-lg hover:bg-[#e5e5e5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              onClick={handleLogin}
              disabled={busy}
            >
              {busy ? "登录中..." : "进入后台"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
