"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const apiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("请输入管理员账号");

  async function handleLogin() {
    setStatus("正在登录管理员...");
    const response = await fetch(`${apiBase}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      setStatus("管理员登录失败");
      return;
    }

    const data = (await response.json()) as { token: string };
    window.localStorage.setItem("hypanel_admin_token", data.token);
    router.push("/admin/dashboard");
  }

  return (
    <main className="page">
      <section className="hero">
        <h1>管理员登录</h1>
        <p>登录后进入后台，生成注册码并查看流量统计。</p>
      </section>

      <article className="card narrow">
        <div className="stack">
          <div>
            <label className="label">邮箱</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">密码</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="button" onClick={handleLogin}>
            登录后台
          </button>
          <div className="notice">{status}</div>
          <Link href="/" className="textLink">
            返回首页
          </Link>
        </div>
      </article>
    </main>
  );
}
