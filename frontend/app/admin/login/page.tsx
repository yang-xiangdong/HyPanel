"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const apiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

function AdminShield() {
  return (
    <div className="adminBadgeMark" aria-hidden="true">
      <svg viewBox="0 0 48 48">
        <path d="M24 4 38 9v12c0 9.5-5.5 17.5-14 21-8.5-3.5-14-11.5-14-21V9Z" />
        <path d="M17 24h14M24 17v14" />
      </svg>
    </div>
  );
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("使用管理员域名直接进入后台登录。");
  const [busy, setBusy] = useState(false);

  async function handleLogin() {
    setBusy(true);
    setStatus("正在验证管理员身份...");

    try {
      const response = await fetch(`${apiBase}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        setStatus("管理员登录失败，请检查邮箱和密码。");
        return;
      }

      const data = (await response.json()) as { token: string };
      window.localStorage.setItem("hypanel_admin_token", data.token);
      router.push("/admin/dashboard");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="adminLoginPage">
      <div className="adminBackdrop" />

      <section className="adminLoginShell">
        <div className="adminLoginAside">
          <AdminShield />
          <span className="eyebrow">HyPanel Admin Console</span>
          <h1>进入管理员控制台</h1>
          <p>
            后续你可以把这个入口直接绑定到 `hy2-admin.yxd.dpdns.org`，不再需要通过首页跳转。
          </p>
        </div>

        <section className="adminLoginCard">
          <div className="statusBar dark">
            <span className="statusDot" />
            <span>{status}</span>
          </div>

          <label className="field">
            <span className="fieldLabel">管理员邮箱</span>
            <div className="fieldInputWrap dark">
              <input
                className="fieldInput dark"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="输入管理员邮箱"
              />
            </div>
          </label>

          <label className="field">
            <span className="fieldLabel">登录密码</span>
            <div className="fieldInputWrap dark">
              <input
                className="fieldInput dark"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="输入管理员密码"
              />
            </div>
          </label>

          <button className="heroButton dark" onClick={handleLogin} disabled={busy}>
            {busy ? "登录中..." : "进入后台"}
          </button>
        </section>
      </section>
    </main>
  );
}
