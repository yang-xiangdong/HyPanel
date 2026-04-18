"use client";

import Link from "next/link";
import { useState } from "react";

type RegisterResponse = {
  username: string;
  password: string;
  subscriptionUrl: string;
  totalTrafficGB: number;
  remainingTrafficGB: number;
};

const apiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

export default function RegisterPage() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<RegisterResponse | null>(null);
  const [status, setStatus] = useState("请输入验证码");

  async function handleRegister() {
    setStatus("正在注册...");
    const response = await fetch(`${apiBase}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      setStatus("注册失败，请检查验证码");
      return;
    }

    const data = (await response.json()) as RegisterResponse;
    setResult(data);
    setStatus("注册成功");
  }

  async function copy(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    setStatus(`${label}已复制`);
  }

  return (
    <main className="page">
      <section className="hero">
        <h1>用户注册</h1>
        <p>输入管理员提供的验证码，系统自动生成账号与密码。</p>
      </section>

      <article className="card narrow">
        <div className="stack">
          <div>
            <label className="label">验证码</label>
            <input className="input" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <button className="button" onClick={handleRegister}>
            注册
          </button>
          <div className="notice">{status}</div>
        </div>

        {result ? (
          <div className="resultBox">
            <div className="stack">
              <div>
                <span className="label">用户名</span>
                <code className="code">{result.username}</code>
              </div>
              <div>
                <span className="label">初始密码</span>
                <div className="inlineRow wrap">
                  <code className="code">{result.password}</code>
                  <button className="button secondary small" onClick={() => copy(result.password, "密码")}>
                    复制密码
                  </button>
                </div>
              </div>
              <div>
                <span className="label">订阅地址</span>
                <div className="inlineRow wrap">
                  <code className="code long">{result.subscriptionUrl}</code>
                  <button className="button secondary small" onClick={() => copy(result.subscriptionUrl, "订阅地址")}>
                    复制订阅地址
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </article>

      <div className="navRow">
        <Link href="/login" className="textLink">
          去登录
        </Link>
        <Link href="/" className="textLink">
          返回首页
        </Link>
      </div>
    </main>
  );
}
