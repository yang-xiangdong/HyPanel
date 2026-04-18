"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { Logo } from "../components/logo";

type RegisterResponse = {
  username: string;
  password: string;
  subscriptionUrl: string;
  totalTrafficGB: number;
  remainingTrafficGB: number;
};

const apiBase =
  process.env.NEXT_PUBLIC_USER_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8080/api/v1";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<RegisterResponse | null>(null);
  const [busy, setBusy] = useState(false);

  const title = useMemo(
    () => (mode === "login" ? "登录到 HyPanel" : "注册新账号"),
    [mode],
  );

  async function handleLogin() {
    setBusy(true);
    setResult(null);
    setStatus("正在验证...");

    try {
      const response = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        setStatus("登录失败，请检查用户名和密码。");
        return;
      }

      const data = (await response.json()) as { token: string };
      window.localStorage.setItem("hypanel_user_token", data.token);
      window.localStorage.setItem("hypanel_user_name", username);
      router.push("/me");
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister() {
    setBusy(true);
    setResult(null);
    setStatus("正在校验验证码...");

    try {
      const response = await fetch(`${apiBase}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        setStatus("验证码无效或已过期。");
        return;
      }

      const data = (await response.json()) as RegisterResponse;
      setResult(data);
      setUsername(data.username);
      setPassword(data.password);
      setMode("login");
      setStatus("账号已生成，可直接登录。");
    } finally {
      setBusy(false);
    }
  }

  async function copy(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    setStatus(`${label}已复制`);
  }

  const inputClass =
    "w-full h-10 px-3 text-sm border border-[#e5e5e5] rounded-lg bg-white text-[#0a0a0a] placeholder:text-[#a3a3a3] focus:outline-none focus:ring-2 focus:ring-[#0a0a0a]/10 focus:border-[#0a0a0a] transition-colors";
  const primaryBtnClass =
    "w-full h-10 bg-[#0a0a0a] text-white text-sm font-medium rounded-lg hover:bg-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer";

  return (
    <main className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <Logo size={44} />
          <h1 className="mt-3 text-xl font-semibold tracking-tight text-[#0a0a0a]">
            {title}
          </h1>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 shadow-sm">
          {/* Tab switcher */}
          <div className="flex gap-1 p-1 bg-[#f5f5f5] rounded-lg mb-6">
            <button
              className={`flex-1 h-9 rounded-md text-sm font-medium transition-all cursor-pointer ${
                mode === "login"
                  ? "bg-white text-[#0a0a0a] shadow-sm"
                  : "text-[#737373] hover:text-[#525252]"
              }`}
              onClick={() => setMode("login")}
            >
              登录
            </button>
            <button
              className={`flex-1 h-9 rounded-md text-sm font-medium transition-all cursor-pointer ${
                mode === "register"
                  ? "bg-white text-[#0a0a0a] shadow-sm"
                  : "text-[#737373] hover:text-[#525252]"
              }`}
              onClick={() => setMode("register")}
            >
              注册
            </button>
          </div>

          {/* Status */}
          {status && (
            <div className="flex items-center gap-2 mb-5 text-sm text-[#737373]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] shrink-0" />
              <span>{status}</span>
            </div>
          )}

          {/* Login form */}
          {mode === "login" ? (
            <div className="space-y-3">
              <input
                className={inputClass}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="用户名"
              />
              <input
                className={inputClass}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="密码"
              />
              <button
                className={primaryBtnClass}
                onClick={handleLogin}
                disabled={busy}
              >
                {busy ? "登录中..." : "登录"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                className={inputClass}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="输入 6 位验证码"
              />
              <button
                className={primaryBtnClass}
                onClick={handleRegister}
                disabled={busy}
              >
                {busy ? "注册中..." : "生成账号"}
              </button>
            </div>
          )}

          {/* Registration result */}
          {result && (
            <div className="mt-6 pt-6 border-t border-[#e5e5e5]">
              <p className="text-sm font-semibold text-[#0a0a0a]">
                账号已开通
              </p>
              <p className="text-xs text-[#737373] mt-1 mb-4">
                请保存以下信息，可直接登录。
              </p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-[#fafafa] rounded-lg p-3 border border-[#f0f0f0]">
                  <span className="text-xs text-[#737373]">用户名</span>
                  <p className="text-sm font-semibold mt-0.5">
                    {result.username}
                  </p>
                </div>
                <div className="bg-[#fafafa] rounded-lg p-3 border border-[#f0f0f0]">
                  <span className="text-xs text-[#737373]">初始密码</span>
                  <p className="text-sm font-semibold mt-0.5">
                    {result.password}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-[#fafafa] border border-[#f0f0f0] rounded-lg p-3">
                <code className="flex-1 text-xs truncate text-[#737373] font-mono">
                  {result.subscriptionUrl}
                </code>
                <button
                  className="shrink-0 h-8 px-3 text-xs font-medium border border-[#e5e5e5] rounded-md hover:bg-[#f0f0f0] transition-colors flex items-center gap-1.5 cursor-pointer"
                  onClick={() => copy(result.subscriptionUrl, "订阅地址")}
                >
                  <Copy size={12} />
                  复制
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
