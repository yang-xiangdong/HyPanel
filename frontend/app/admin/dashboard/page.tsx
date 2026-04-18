"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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

const sections = [
  { id: "overview", label: "总览" },
  { id: "users", label: "用户" },
  { id: "actions", label: "操作" },
  { id: "traffic", label: "统计" },
] as const;

export default function AdminDashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("正在同步后台数据");
  const [keyword, setKeyword] = useState("");
  const [editingQuota, setEditingQuota] = useState<Record<string, string>>({});
  const [resetResult, setResetResult] = useState<{
    username: string;
    password: string;
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

  useEffect(() => {
    function onScroll() {
      const sectionIds = sections.map((item) => item.id);
      const visible = sectionIds.findLast((id) => {
        const el = document.getElementById(id);
        if (!el) return false;
        return el.getBoundingClientRect().top < 160;
      });
      if (visible) setActiveSection(visible);
    }

    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
      setStatus("生成验证码失败");
      return;
    }

    const data = (await response.json()) as { code: string };
    setCode(data.code);
    setStatus("新的注册码已生成，有效期 1 小时");
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
      setStatus("请输入有效的流量额度");
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

    setStatus(`用户 ${username} 的流量额度已更新`);
    await loadDashboard(token);
  }

  async function handleResetPassword(username: string) {
    const response = await fetch(`${apiBase}/admin/users/${username}/reset-password`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
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
  const onlineUsers =
    dashboard?.users.reduce((sum, item) => sum + (item.onlineCount > 0 ? 1 : 0), 0) ?? 0;

  const filteredUsers = useMemo(
    () =>
      dashboard?.users.filter((item) =>
        item.username.toLowerCase().includes(keyword.trim().toLowerCase()),
      ) ?? [],
    [dashboard?.users, keyword],
  );

  function jumpTo(id: (typeof sections)[number]["id"]) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="consolePage">
      <aside className="consoleSidebar">
        <div className="consoleBrand">
          <div className="brandMark mini">
            <svg viewBox="0 0 48 48" className="brandMarkIcon">
              <rect x="2" y="2" width="44" height="44" rx="12" />
              <path d="M14 14h20l-12 20h12" />
            </svg>
          </div>
          <div>
            <strong>HyPanel</strong>
            <span>Admin Console</span>
          </div>
        </div>

        <nav className="consoleNav">
          {sections.map((item) => (
            <button
              key={item.id}
              className={`navItem ${activeSection === item.id ? "active" : ""}`}
              onClick={() => jumpTo(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebarFooter">
          <div className="statusCard">
            <span className="statusCardLabel">系统状态</span>
            <strong>在线</strong>
            <p>{status}</p>
          </div>
          <button className="ghostButton wide" onClick={handleLogout}>
            退出管理员
          </button>
        </div>
      </aside>

      <section className="consoleMain">
        <header className="consoleHeader">
          <div>
            <span className="eyebrow">Operations</span>
            <h1>管理员后台</h1>
            <p>分区式控制台更适合用户量变大后的长期维护，也更适合后续扩展功能。</p>
          </div>
          <div className="consoleHeaderMeta">
            <div className="statusBar inline">
              <span className="statusDot" />
              <span>{status}</span>
            </div>
            <button className="heroButton compact" onClick={() => void loadDashboard(token)}>
              刷新数据
            </button>
          </div>
        </header>

        <section id="overview" className="consoleSection">
          <div className="sectionHeading">
            <div>
              <h2>总览</h2>
              <p>优先展示关键平台指标和注册码动作。</p>
            </div>
          </div>

          <div className="overviewGrid">
            <article className="glassCard actionCard">
              <div className="cardTopline">注册码</div>
              <h3>生成用户开通验证码</h3>
              <p>单次生成，默认有效 1 小时。适合人工发放和临时审核。</p>
              <button className="heroButton" onClick={handleGenerateCode}>
                生成新验证码
              </button>
              <div className="codeStrip">
                <span>当前验证码</span>
                <strong>{code || "尚未生成"}</strong>
              </div>
            </article>

            <div className="metricGrid">
              <article className="metricCard">
                <span>用户总数</span>
                <strong>{totalUsers}</strong>
                <small>已注册用户</small>
              </article>
              <article className="metricCard">
                <span>总流量消耗</span>
                <strong>{formatGB(totalUsed)}</strong>
                <small>Hysteria 汇总</small>
              </article>
              <article className="metricCard">
                <span>在线用户</span>
                <strong>{onlineUsers}</strong>
                <small>当前有设备在线</small>
              </article>
              <article className="metricCard">
                <span>验证码时效</span>
                <strong>1H</strong>
                <small>默认过期时间</small>
              </article>
            </div>
          </div>
        </section>

        <section id="users" className="consoleSection">
          <div className="sectionHeading">
            <div>
              <h2>用户视图</h2>
              <p>搜索、浏览和对比所有用户的额度与在线情况。</p>
            </div>
            <input
              className="searchField"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索用户名"
            />
          </div>

          <div className="glassCard tableCard">
            <table className="table refined">
              <thead>
                <tr>
                  <th>用户名</th>
                  <th>状态</th>
                  <th>总流量</th>
                  <th>已用</th>
                  <th>剩余</th>
                  <th>在线设备</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length ? (
                  filteredUsers.map((item) => (
                    <tr key={item.username}>
                      <td className="strongCell">{item.username}</td>
                      <td>
                        <span className={`statePill ${item.status === "active" ? "green" : "gray"}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>{item.totalTrafficGB} GB</td>
                      <td>{formatGB(item.usedTrafficBytes)}</td>
                      <td>{item.remainingTrafficGB} GB</td>
                      <td>{item.onlineCount}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="muted centerCell">
                      没有匹配到用户
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section id="actions" className="consoleSection">
          <div className="sectionHeading">
            <div>
              <h2>用户操作</h2>
              <p>统一处理状态切换、流量额度调整和密码重置。</p>
            </div>
          </div>

          <div className="glassCard tableCard">
            <table className="table refined">
              <thead>
                <tr>
                  <th>用户</th>
                  <th>状态</th>
                  <th>流量额度</th>
                  <th>状态操作</th>
                  <th>密码操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length ? (
                  filteredUsers.map((item) => (
                    <tr key={`${item.username}-action`}>
                      <td className="strongCell">{item.username}</td>
                      <td>{item.status}</td>
                      <td>
                        <div className="actionInline">
                          <input
                            className="quotaField"
                            value={editingQuota[item.username] ?? String(item.totalTrafficGB)}
                            onChange={(event) =>
                              setEditingQuota((prev) => ({
                                ...prev,
                                [item.username]: event.target.value,
                              }))
                            }
                          />
                          <button
                            className="ghostButton"
                            onClick={() => void handleUpdateQuota(item.username)}
                          >
                            保存
                          </button>
                        </div>
                      </td>
                      <td>
                        <button
                          className="ghostButton"
                          onClick={() =>
                            void handleToggleStatus(
                              item.username,
                              item.status === "active" ? "disabled" : "active",
                            )
                          }
                        >
                          {item.status === "active" ? "禁用" : "启用"}
                        </button>
                      </td>
                      <td>
                        <button
                          className="ghostButton"
                          onClick={() => void handleResetPassword(item.username)}
                        >
                          重置密码
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="muted centerCell">
                      当前没有可操作的用户
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {resetResult ? (
            <div className="glassCard resetCard">
              <div className="sectionHeading tight">
                <div>
                  <h3>最近一次重置结果</h3>
                  <p>新密码已经生效，请尽快发给对应用户。</p>
                </div>
              </div>
              <div className="resetGrid">
                <div className="miniPanel dark">
                  <span>用户名</span>
                  <strong>{resetResult.username}</strong>
                </div>
                <div className="miniPanel dark">
                  <span>新密码</span>
                  <strong>{resetResult.password}</strong>
                </div>
              </div>
              <div className="copyPanel dark">
                <code>{resetResult.subscriptionUrl}</code>
              </div>
            </div>
          ) : null}
        </section>

        <section id="traffic" className="consoleSection">
          <div className="sectionHeading">
            <div>
              <h2>流量统计</h2>
              <p>保留原始上传、下载、总量与在线设备视图，用于排查与核对。</p>
            </div>
          </div>

          <div className="glassCard tableCard">
            <table className="table refined">
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
                      <td className="strongCell">{item.username}</td>
                      <td>{formatGB(item.uploadBytes)}</td>
                      <td>{formatGB(item.downloadBytes)}</td>
                      <td>{formatGB(item.totalBytes)}</td>
                      <td>{item.onlineCount}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="muted centerCell">
                      暂无统计数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
