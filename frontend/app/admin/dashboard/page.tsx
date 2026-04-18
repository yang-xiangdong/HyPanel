"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type DashboardResponse = {
  users: Array<{
    username: string;
    status: string;
    totalTrafficGB: number;
    usedTrafficBytes: number;
    remainingTrafficGB: number;
    onlineCount: number;
  }>;
  traffic: Array<{
    username: string;
    uploadBytes: number;
    downloadBytes: number;
    totalBytes: number;
    onlineCount: number;
  }>;
};

const apiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

function formatGB(bytes: number) {
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("正在加载后台数据...");
  const [keyword, setKeyword] = useState("");
  const [editingQuota, setEditingQuota] = useState<Record<string, string>>({});
  const [resetResult, setResetResult] = useState<{ username: string; password: string; subscriptionUrl: string } | null>(null);

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
    const response = await fetch(`${apiBase}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${currentToken}` },
      cache: "no-store",
    });

    if (!response.ok) {
      setStatus("后台加载失败，请重新登录");
      return;
    }

    const data = (await response.json()) as DashboardResponse;
    setDashboard(data);
    setStatus("后台已就绪");
  }

  async function handleGenerateCode() {
    const response = await fetch(`${apiBase}/admin/codes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ scope: "register" }),
    });

    if (!response.ok) {
      setStatus("验证码生成失败");
      return;
    }

    const data = (await response.json()) as { code: string };
    setCode(data.code);
    setStatus("验证码已生成");
  }

  async function handleToggleStatus(username: string, nextStatus: "active" | "disabled") {
    const response = await fetch(`${apiBase}/admin/users/${username}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: nextStatus }),
    });

    if (!response.ok) {
      setStatus("更新用户状态失败");
      return;
    }

    setStatus(`用户 ${username} 已更新为 ${nextStatus}`);
    await loadDashboard(token);
  }

  async function handleUpdateQuota(username: string) {
    const quota = Number(editingQuota[username] ?? "");
    if (Number.isNaN(quota) || quota < 0) {
      setStatus("请输入有效流量额度");
      return;
    }

    const response = await fetch(`${apiBase}/admin/users/${username}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ totalTrafficGB: quota }),
    });

    if (!response.ok) {
      setStatus("更新流量额度失败");
      return;
    }

    setStatus(`用户 ${username} 的总流量已更新`);
    await loadDashboard(token);
  }

  async function handleResetPassword(username: string) {
    const response = await fetch(`${apiBase}/admin/users/${username}/reset-password`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      setStatus("重置密码失败");
      return;
    }

    const data = (await response.json()) as {
      username: string;
      password: string;
      subscriptionUrl: string;
    };
    setResetResult(data);
    setStatus(`用户 ${username} 的密码已重置`);
  }

  function handleLogout() {
    window.localStorage.removeItem("hypanel_admin_token");
    router.push("/admin/login");
  }

  const totalUsers = dashboard?.users.length ?? 0;
  const totalUsed = dashboard?.traffic.reduce((sum, item) => sum + item.totalBytes, 0) ?? 0;
  const filteredUsers =
    dashboard?.users.filter((item) =>
      item.username.toLowerCase().includes(keyword.trim().toLowerCase()),
    ) ?? [];

  return (
    <main className="page">
      <section className="hero">
        <h1>管理员后台</h1>
        <p>生成注册码，查看平台流量统计与在线设备情况。</p>
      </section>

      <section className="toolbar">
        <span className="pill success">{status}</span>
        <button className="button secondary small" onClick={handleLogout}>
          退出管理员
        </button>
      </section>

      <section className="grid">
        <article className="card span-4">
          <h2>生成验证码</h2>
          <p>注册码默认 1 小时有效，发给用户后即可注册。</p>
          <div className="stack">
            <button className="button" onClick={handleGenerateCode}>
              生成注册码
            </button>
            <div className="notice">
              <strong>当前验证码</strong>
              <div className="code">{code || "尚未生成"}</div>
            </div>
          </div>
        </article>

        <article className="card span-8">
          <h2>平台概览</h2>
          <div className="stats">
            <div className="stat">
              <span className="muted">用户数</span>
              <strong>{totalUsers}</strong>
            </div>
            <div className="stat">
              <span className="muted">总流量消耗</span>
              <strong>{formatGB(totalUsed)}</strong>
            </div>
            <div className="stat">
              <span className="muted">验证码有效期</span>
              <strong>1 小时</strong>
            </div>
          </div>
        </article>

        <article className="card span-12">
          <div className="sectionRow">
            <div>
              <h2>用户列表</h2>
              <p>支持按用户名搜索，展示总流量、已用、剩余和在线设备。</p>
            </div>
            <input
              className="input searchInput"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索用户名"
            />
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>用户名</th>
                <th>状态</th>
                <th>总流量</th>
                <th>已用流量</th>
                <th>剩余流量</th>
                <th>在线设备</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length ? (
                filteredUsers.map((item) => (
                  <tr key={item.username}>
                    <td>{item.username}</td>
                    <td>{item.status}</td>
                    <td>{item.totalTrafficGB} GB</td>
                    <td>{formatGB(item.usedTrafficBytes)}</td>
                    <td>{item.remainingTrafficGB} GB</td>
                    <td>{item.onlineCount}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="muted">
                    没有匹配的用户
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </article>

        <article className="card span-12">
          <h2>用户操作</h2>
          <p>管理员可以禁用用户、调整流量额度或重置密码。</p>
          <table className="table">
            <thead>
              <tr>
                <th>用户名</th>
                <th>当前状态</th>
                <th>流量额度</th>
                <th>状态操作</th>
                <th>密码操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length ? (
                filteredUsers.map((item) => (
                  <tr key={`${item.username}-actions`}>
                    <td>{item.username}</td>
                    <td>{item.status}</td>
                    <td>
                      <div className="inlineRow wrap">
                        <input
                          className="input quotaInput"
                          value={editingQuota[item.username] ?? String(item.totalTrafficGB)}
                          onChange={(event) =>
                            setEditingQuota((prev) => ({
                              ...prev,
                              [item.username]: event.target.value,
                            }))
                          }
                        />
                        <button className="button secondary small" onClick={() => void handleUpdateQuota(item.username)}>
                          保存额度
                        </button>
                      </div>
                    </td>
                    <td>
                      <button
                        className="button secondary small"
                        onClick={() => void handleToggleStatus(item.username, item.status === "active" ? "disabled" : "active")}
                      >
                        {item.status === "active" ? "禁用" : "启用"}
                      </button>
                    </td>
                    <td>
                      <button className="button secondary small" onClick={() => void handleResetPassword(item.username)}>
                        重置密码
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="muted">
                    没有可操作的用户
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </article>

        {resetResult ? (
          <article className="card span-12">
            <h2>重置结果</h2>
            <p>请及时把新密码发给用户，旧密码已失效。</p>
            <div className="stack">
              <div>
                <span className="label">用户名</span>
                <code className="code">{resetResult.username}</code>
              </div>
              <div>
                <span className="label">新密码</span>
                <code className="code">{resetResult.password}</code>
              </div>
              <div>
                <span className="label">新订阅地址</span>
                <code className="code long">{resetResult.subscriptionUrl}</code>
              </div>
            </div>
          </article>
        ) : null}

        <article className="card span-12">
          <div className="sectionRow">
            <div>
              <h2>流量统计</h2>
              <p>展示 Hysteria 统计里的上传、下载、总量与在线设备数。</p>
            </div>
            <button className="button secondary small" onClick={() => void loadDashboard(token)}>
              刷新
            </button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>用户名</th>
                <th>上传</th>
                <th>下载</th>
                <th>总量</th>
                <th>在线设备</th>
              </tr>
            </thead>
            <tbody>
              {dashboard?.traffic.length ? (
                dashboard.traffic.map((item) => (
                  <tr key={item.username}>
                    <td>{item.username}</td>
                    <td>{formatGB(item.uploadBytes)}</td>
                    <td>{formatGB(item.downloadBytes)}</td>
                    <td>{formatGB(item.totalBytes)}</td>
                    <td>{item.onlineCount}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="muted">
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </article>
      </section>

      <Link href="/" className="textLink">
        返回首页
      </Link>
    </main>
  );
}
