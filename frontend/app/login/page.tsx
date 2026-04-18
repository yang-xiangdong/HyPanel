"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const apiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("请输入账号密码");

  async function handleLogin() {
    setStatus("正在登录...");
    const response = await fetch(`${apiBase}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      setStatus("登录失败");
      return;
    }

    const data = (await response.json()) as { token: string };
    window.localStorage.setItem("hypanel_user_token", data.token);
    window.localStorage.setItem("hypanel_user_name", username);
    router.push("/me");
  }

  return (
    <main className="page">
      <section className="hero">
        <h1>用户登录</h1>
        <p>登录后查看专属订阅、总流量和剩余流量。</p>
      </section>

      <article className="card narrow">
        <div className="stack">
          <div>
            <label className="label">用户名</label>
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <label className="label">密码</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="button" onClick={handleLogin}>
            登录
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
