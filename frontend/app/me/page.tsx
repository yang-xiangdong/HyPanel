"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Copy, LogOut } from "lucide-react";
import { Logo } from "../components/logo";

type UserProfile = {
  username: string;
  subscriptionUrl: string;
  totalTrafficGB: number;
  remainingTrafficGB: number;
  usedTrafficBytes: number;
};

const apiBase =
  process.env.NEXT_PUBLIC_USER_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8080/api/v1";

function formatGB(bytes: number) {
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)}`;
}

export default function MePage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState("正在同步数据...");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("hypanel_user_token");
    if (!saved) {
      router.push("/auth");
      return;
    }
    setToken(saved);
  }, [router]);

  useEffect(() => {
    if (!token) return;
    void loadProfile(token);
  }, [token]);

  async function loadProfile(currentToken: string) {
    const response = await fetch(`${apiBase}/me`, {
      headers: { Authorization: `Bearer ${currentToken}` },
      cache: "no-store",
    });

    if (!response.ok) {
      setStatus("加载失败，请重新登录");
      return;
    }

    const data = (await response.json()) as UserProfile;
    setProfile(data);
    setStatus("已同步");
  }

  async function copyUrl() {
    if (!profile?.subscriptionUrl) return;
    await navigator.clipboard.writeText(profile.subscriptionUrl);
    setCopied(true);
    setStatus("订阅地址已复制");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleLogout() {
    window.localStorage.removeItem("hypanel_user_token");
    router.push("/auth");
  }

  return (
    <main className="min-h-screen bg-[#fafafa]">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-[#e5e5e5]">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={28} />
            <span className="text-sm font-semibold">HyPanel</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#737373]">
              {profile?.username ?? ""}
            </span>
            <button
              onClick={handleLogout}
              className="h-8 px-3 text-xs font-medium border border-[#e5e5e5] rounded-md hover:bg-[#f5f5f5] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut size={14} />
              退出
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Traffic stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white border border-[#e5e5e5] rounded-xl p-5">
            <span className="text-xs text-[#737373] font-medium">总流量</span>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-2xl font-semibold tracking-tight">
                {profile?.totalTrafficGB ?? 0}
              </span>
              <span className="text-xs text-[#a3a3a3]">GB</span>
            </div>
          </div>
          <div className="bg-white border border-[#e5e5e5] rounded-xl p-5">
            <span className="text-xs text-[#737373] font-medium">剩余</span>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-2xl font-semibold tracking-tight">
                {profile?.remainingTrafficGB ?? 0}
              </span>
              <span className="text-xs text-[#a3a3a3]">GB</span>
            </div>
          </div>
          <div className="bg-white border border-[#e5e5e5] rounded-xl p-5">
            <span className="text-xs text-[#737373] font-medium">已用</span>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-2xl font-semibold tracking-tight">
                {formatGB(profile?.usedTrafficBytes ?? 0)}
              </span>
              <span className="text-xs text-[#a3a3a3]">GB</span>
            </div>
          </div>
        </div>

        {/* Subscription URL */}
        <div className="bg-white border border-[#e5e5e5] rounded-xl p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#0a0a0a]">订阅地址</h2>
            <button
              onClick={copyUrl}
              disabled={!profile?.subscriptionUrl}
              className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium bg-[#0a0a0a] text-white rounded-md hover:bg-[#1a1a1a] disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Copy size={14} />
              {copied ? "已复制" : "复制"}
            </button>
          </div>
          <div className="bg-[#fafafa] rounded-lg p-3 border border-[#f0f0f0]">
            <code className="text-xs text-[#737373] break-all leading-relaxed font-mono">
              {profile?.subscriptionUrl ?? "-"}
            </code>
          </div>
        </div>

        {/* Usage guide */}
        <div className="bg-white border border-[#e5e5e5] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[#0a0a0a] mb-4">
            使用说明
          </h2>
          <ol className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#0a0a0a] text-white text-[10px] font-semibold shrink-0 mt-0.5">
                1
              </span>
              <span className="text-sm text-[#525252] leading-relaxed">
                将订阅地址导入 Clash Verge。
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#0a0a0a] text-white text-[10px] font-semibold shrink-0 mt-0.5">
                2
              </span>
              <span className="text-sm text-[#525252] leading-relaxed">
                建议开启自动刷新，保持配置最新。
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#0a0a0a] text-white text-[10px] font-semibold shrink-0 mt-0.5">
                3
              </span>
              <span className="text-sm text-[#525252] leading-relaxed">
                若流量异常，请联系管理员核对。
              </span>
            </li>
          </ol>
        </div>
      </div>
    </main>
  );
}
