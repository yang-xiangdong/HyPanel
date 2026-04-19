"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Settings,
  BarChart3,
  LogOut,
  RefreshCw,
  Search,
  X,
  Copy,
} from "lucide-react";
import { Logo } from "../../components/logo";

type DashboardResponse = {
  users: Array<{
    username: string;
    status: string;
    totalTrafficGB: number;
    usedTrafficBytes: number;
    remainingTrafficGB: number;
    onlineCount: number;
  }>;
};

const apiBase =
  process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8080/api/v1";

function formatGB(bytes: number) {
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

const sections = [
  { id: "overview", label: "总览", icon: LayoutDashboard },
  { id: "users", label: "用户", icon: Users },
  { id: "actions", label: "操作", icon: Settings },
  { id: "traffic", label: "统计", icon: BarChart3 },
] as const;

export default function AdminDashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("正在同步...");
  const [keyword, setKeyword] = useState("");
  const [editingQuota, setEditingQuota] = useState<Record<string, string>>({});
  const [resetResult, setResetResult] = useState<{
    username: string;
    loginPassword: string;
    proxyPassword: string;
    subscriptionUrl: string;
  } | null>(null);
  const [activeSection, setActiveSection] =
    useState<(typeof sections)[number]["id"]>("overview");

  useEffect(() => {
    const saved = window.localStorage.getItem("hypanel_admin_token");
    if (!saved) {
      router.push("/admin/login");
      return;
    }
    setToken(saved);
  }, [router]);

  useEffect(() => {
    if (!token) return;
    void loadDashboard(token);
  }, [token]);

  async function loadDashboard(currentToken: string) {
    try {
      const response = await fetch(`${apiBase}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${currentToken}` },
        cache: "no-store",
      });

      if (!response.ok) {
        setStatus("加载失败，请重新登录");
        return;
      }

      const data = (await response.json()) as DashboardResponse;
      setDashboard(data);
      setStatus("已就绪");
    } catch {
      setStatus("网络错误，请检查连接");
    }
  }

  async function handleGenerateCode() {
    try {
      const response = await fetch(`${apiBase}/admin/codes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ scope: "register" }),
      });

      if (!response.ok) {
        setStatus("生成失败");
        return;
      }

      const data = (await response.json()) as { code: string };
      setCode(data.code);
      setStatus("验证码已生成，有效期 1 小时");
    } catch {
      setStatus("网络错误，请检查连接");
    }
  }

  async function handleToggleStatus(
    username: string,
    nextStatus: "active" | "disabled",
  ) {
    try {
      const response = await fetch(`${apiBase}/admin/users/${username}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        setStatus("更新失败");
        return;
      }

      setStatus(`${username} 已${nextStatus === "active" ? "启用" : "禁用"}`);
      await loadDashboard(token);
    } catch {
      setStatus("网络错误，请检查连接");
    }
  }

  async function handleUpdateQuota(username: string) {
    const quota = Number(editingQuota[username] ?? "");
    if (Number.isNaN(quota) || quota < 0) {
      setStatus("请输入有效数值");
      return;
    }

    try {
      const response = await fetch(`${apiBase}/admin/users/${username}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ totalTrafficGB: quota }),
      });

      if (!response.ok) {
        setStatus("更新失败");
        return;
      }

      setStatus(`${username} 额度已更新`);
      await loadDashboard(token);
    } catch {
      setStatus("网络错误，请检查连接");
    }
  }

  async function handleResetPassword(username: string) {
    try {
      const response = await fetch(
        `${apiBase}/admin/users/${username}/reset-password`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        setStatus("重置失败");
        return;
      }

      const data = (await response.json()) as {
        username: string;
        loginPassword: string;
        proxyPassword: string;
        subscriptionUrl: string;
      };
      setResetResult(data);
      setStatus(`${username} 密码已重置`);
    } catch {
      setStatus("网络错误，请检查连接");
    }
  }

  function handleLogout() {
    window.localStorage.removeItem("hypanel_admin_token");
    router.push("/admin/login");
  }

  const totalUsers = dashboard?.users.length ?? 0;
  const totalUsed =
    dashboard?.users.reduce((sum, item) => sum + item.usedTrafficBytes, 0) ?? 0;
  const onlineUsers =
    dashboard?.users.reduce(
      (sum, item) => sum + (item.onlineCount > 0 ? 1 : 0),
      0,
    ) ?? 0;

  const filteredUsers = useMemo(
    () =>
      dashboard?.users.filter((item) =>
        item.username.toLowerCase().includes(keyword.trim().toLowerCase()),
      ) ?? [],
    [dashboard?.users, keyword],
  );

  const thClass =
    "text-left px-4 py-3 text-xs font-medium text-[#737373] uppercase tracking-wider";
  const tdClass = "px-4 py-3 text-sm";
  const ghostBtnClass =
    "h-8 px-2.5 text-xs font-medium border border-[#e5e5e5] rounded-md hover:bg-[#f5f5f5] transition-colors cursor-pointer";

  return (
    <div className="min-h-screen bg-[#fafafa] flex">
      {/* Sidebar */}
      <aside className="w-[220px] shrink-0 bg-white border-r border-[#e5e5e5] flex flex-col fixed inset-y-0 left-0 z-20">
        {/* Brand */}
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-[#e5e5e5]">
          <Logo size={28} />
          <div>
            <p className="text-sm font-semibold leading-tight">HyPanel</p>
            <p className="text-[11px] text-[#a3a3a3] leading-tight">Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-2.5 h-9 px-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
                  activeSection === s.id
                    ? "bg-[#f5f5f5] text-[#0a0a0a] font-medium"
                    : "text-[#737373] hover:bg-[#fafafa] hover:text-[#525252]"
                }`}
              >
                <Icon size={16} />
                {s.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-[#e5e5e5]">
          <div className="flex items-center gap-2 mb-3 px-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
            <span className="text-xs text-[#737373] truncate">{status}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 h-9 px-2.5 rounded-lg text-sm text-[#737373] hover:bg-[#fafafa] hover:text-[#525252] transition-colors cursor-pointer"
          >
            <LogOut size={16} />
            退出
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-[220px]">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-[#fafafa]/80 backdrop-blur-sm border-b border-[#e5e5e5]">
          <div className="h-14 flex items-center justify-between px-6">
            <h1 className="text-base font-semibold tracking-tight">
              {sections.find((s) => s.id === activeSection)?.label}
            </h1>
            <button
              onClick={() => void loadDashboard(token)}
              className="h-8 px-3 flex items-center gap-1.5 text-xs font-medium border border-[#e5e5e5] rounded-md bg-white hover:bg-[#f5f5f5] transition-colors cursor-pointer"
            >
              <RefreshCw size={14} />
              刷新
            </button>
          </div>
        </header>

        <div className="p-6">
          {/* ===== Overview ===== */}
          {activeSection === "overview" && (
            <div>
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white border border-[#e5e5e5] rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={14} className="text-[#a3a3a3]" />
                    <span className="text-xs text-[#737373] font-medium">
                      用户总数
                    </span>
                  </div>
                  <p className="text-2xl font-semibold tracking-tight">
                    {totalUsers}
                  </p>
                </div>
                <div className="bg-white border border-[#e5e5e5] rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 size={14} className="text-[#a3a3a3]" />
                    <span className="text-xs text-[#737373] font-medium">
                      总消耗
                    </span>
                  </div>
                  <p className="text-2xl font-semibold tracking-tight">
                    {formatGB(totalUsed)}
                  </p>
                </div>
                <div className="bg-white border border-[#e5e5e5] rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
                    <span className="text-xs text-[#737373] font-medium">
                      在线
                    </span>
                  </div>
                  <p className="text-2xl font-semibold tracking-tight">
                    {onlineUsers}
                  </p>
                </div>
              </div>

              {/* Generate code */}
              <div className="bg-white border border-[#e5e5e5] rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">注册码</h3>
                    <p className="text-xs text-[#737373] mt-0.5">
                      一次性验证码，有效期 1 小时
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateCode}
                    className="h-9 px-4 bg-[#0a0a0a] text-white text-sm font-medium rounded-md hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                  >
                    生成
                  </button>
                </div>
                {code && (
                  <div className="flex items-center justify-between bg-[#fafafa] border border-[#f0f0f0] rounded-lg p-3 mt-4">
                    <span className="text-xs text-[#737373]">当前验证码</span>
                    <span className="font-mono text-lg font-semibold tracking-widest">
                      {code}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== Users ===== */}
          {activeSection === "users" && (
            <div>
              <div className="mb-4">
                <div className="relative w-72">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a3a3a3]"
                  />
                  <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="搜索用户名..."
                    className="w-full h-9 pl-9 pr-3 text-sm border border-[#e5e5e5] rounded-md bg-white placeholder:text-[#a3a3a3] focus:outline-none focus:ring-2 focus:ring-[#0a0a0a]/10 focus:border-[#0a0a0a] transition-colors"
                  />
                </div>
              </div>

              <div className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#e5e5e5]">
                      <th className={thClass}>用户名</th>
                      <th className={thClass}>状态</th>
                      <th className={thClass}>总流量</th>
                      <th className={thClass}>已用</th>
                      <th className={thClass}>剩余</th>
                      <th className={thClass}>在线</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0f0]">
                    {filteredUsers.map((u) => (
                      <tr
                        key={u.username}
                        className="hover:bg-[#fafafa] transition-colors"
                      >
                        <td className={`${tdClass} font-medium`}>
                          {u.username}
                        </td>
                        <td className={tdClass}>
                          <span
                            className={`inline-flex items-center h-5 px-2 rounded text-[11px] font-semibold ${
                              u.status === "active"
                                ? "bg-[#22c55e]/10 text-[#16a34a]"
                                : "bg-[#f5f5f5] text-[#a3a3a3]"
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className={`${tdClass} text-[#525252]`}>
                          {u.totalTrafficGB} GB
                        </td>
                        <td className={`${tdClass} text-[#525252]`}>
                          {formatGB(u.usedTrafficBytes)}
                        </td>
                        <td className={`${tdClass} text-[#525252]`}>
                          {u.remainingTrafficGB} GB
                        </td>
                        <td className={`${tdClass} text-[#525252]`}>
                          {u.onlineCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!filteredUsers.length && (
                  <div className="py-12 text-center text-sm text-[#a3a3a3]">
                    没有匹配到用户
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== Actions ===== */}
          {activeSection === "actions" && (
            <div>
              <div className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#e5e5e5]">
                      <th className={thClass}>用户</th>
                      <th className={thClass}>状态</th>
                      <th className={thClass}>流量额度 (GB)</th>
                      <th className={`${thClass} text-right`}>操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0f0]">
                    {filteredUsers.map((u) => (
                      <tr
                        key={u.username}
                        className="hover:bg-[#fafafa] transition-colors"
                      >
                        <td className={`${tdClass} font-medium`}>
                          {u.username}
                        </td>
                        <td className={tdClass}>
                          <span
                            className={`inline-flex items-center h-5 px-2 rounded text-[11px] font-semibold ${
                              u.status === "active"
                                ? "bg-[#22c55e]/10 text-[#16a34a]"
                                : "bg-[#f5f5f5] text-[#a3a3a3]"
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className={tdClass}>
                          <div className="flex items-center gap-2">
                            <input
                              className="w-20 h-8 px-2 text-sm border border-[#e5e5e5] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0a0a0a]/10 transition-colors"
                              value={
                                editingQuota[u.username] ??
                                String(u.totalTrafficGB)
                              }
                              onChange={(e) =>
                                setEditingQuota((prev) => ({
                                  ...prev,
                                  [u.username]: e.target.value,
                                }))
                              }
                            />
                            <button
                              className={ghostBtnClass}
                              onClick={() => void handleUpdateQuota(u.username)}
                            >
                              保存
                            </button>
                          </div>
                        </td>
                        <td className={`${tdClass} text-right`}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              className={ghostBtnClass}
                              onClick={() =>
                                void handleToggleStatus(
                                  u.username,
                                  u.status === "active"
                                    ? "disabled"
                                    : "active",
                                )
                              }
                            >
                              {u.status === "active" ? "禁用" : "启用"}
                            </button>
                            <button
                              className={`${ghostBtnClass} text-[#ef4444] border-[#fecaca] hover:bg-[#fef2f2]`}
                              onClick={() =>
                                void handleResetPassword(u.username)
                              }
                            >
                              重置密码
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!filteredUsers.length && (
                  <div className="py-12 text-center text-sm text-[#a3a3a3]">
                    暂无用户
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== Traffic ===== */}
          {activeSection === "traffic" && (
            <div>
              <div className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#e5e5e5]">
                      <th className={thClass}>用户名</th>
                      <th className={thClass}>总额度</th>
                      <th className={thClass}>已用</th>
                      <th className={thClass}>剩余</th>
                      <th className={thClass}>在线设备</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0f0]">
                    {dashboard?.users.length ? (
                      dashboard.users.map((u) => (
                        <tr
                          key={u.username}
                          className="hover:bg-[#fafafa] transition-colors"
                        >
                          <td className={`${tdClass} font-medium`}>
                            {u.username}
                          </td>
                          <td className={`${tdClass} text-[#525252]`}>
                            {u.totalTrafficGB} GB
                          </td>
                          <td className={`${tdClass} text-[#525252]`}>
                            {formatGB(u.usedTrafficBytes)}
                          </td>
                          <td className={`${tdClass} text-[#525252]`}>
                            {u.remainingTrafficGB} GB
                          </td>
                          <td className={`${tdClass} text-[#525252]`}>
                            {u.onlineCount}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-12 text-center text-sm text-[#a3a3a3]"
                        >
                          暂无数据
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Password reset modal */}
      {resetResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setResetResult(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-lg border border-[#e5e5e5]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">密码已重置</h3>
              <button
                onClick={() => setResetResult(null)}
                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#f5f5f5] transition-colors cursor-pointer"
              >
                <X size={16} className="text-[#737373]" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-[#fafafa] rounded-lg p-3 border border-[#f0f0f0]">
                <span className="text-xs text-[#737373]">用户名</span>
                <p className="text-sm font-semibold mt-0.5">
                  {resetResult.username}
                </p>
              </div>
              <div className="bg-[#fafafa] rounded-lg p-3 border border-[#f0f0f0]">
                <span className="text-xs text-[#737373]">登录密码</span>
                <p className="text-sm font-semibold mt-0.5">
                  {resetResult.loginPassword}
                </p>
              </div>
            </div>

            <div className="bg-[#fafafa] rounded-lg p-3 border border-[#f0f0f0] mb-3">
              <span className="text-xs text-[#737373]">代理密码</span>
              <p className="text-sm font-semibold mt-0.5">
                {resetResult.proxyPassword}
              </p>
              <p className="text-[11px] text-[#a3a3a3] mt-1">
                用于 Hysteria 客户端认证
              </p>
            </div>

            <div className="bg-[#fafafa] rounded-lg p-3 border border-[#f0f0f0] mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#737373]">订阅地址</span>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        resetResult.subscriptionUrl,
                      );
                      setStatus("订阅地址已复制");
                    } catch {
                      setStatus("复制失败，请手动复制");
                    }
                  }}
                  className="text-xs text-[#737373] hover:text-[#0a0a0a] flex items-center gap-1 cursor-pointer"
                >
                  <Copy size={12} />
                  复制
                </button>
              </div>
              <code className="text-xs break-all leading-relaxed font-mono text-[#525252]">
                {resetResult.subscriptionUrl}
              </code>
            </div>

            <button
              onClick={() => setResetResult(null)}
              className="w-full h-9 bg-[#0a0a0a] text-white text-sm font-medium rounded-md hover:bg-[#1a1a1a] transition-colors cursor-pointer"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
