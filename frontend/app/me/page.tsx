"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type UserProfile = {
  username: string;
  subscriptionUrl: string;
  totalTrafficGB: number;
  remainingTrafficGB: number;
  usedTrafficBytes: number;
};

const apiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

function formatGB(bytes: number) {
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export default function MePage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState("正在加载个人信息...");

  useEffect(() => {
    const saved = window.localStorage.getItem("hypanel_user_token");
    if (!saved) {
      router.push("/login");
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
      setStatus("个人信息加载失败，请重新登录");
      return;
    }

    const data = (await response.json()) as UserProfile;
    setProfile(data);
    setStatus("个人信息已更新");
  }

  async function copy(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    setStatus(`${label}已复制`);
  }

  function handleLogout() {
    window.localStorage.removeItem("hypanel_user_token");
    router.push("/login");
  }

  return (
    <main className="page">
      <section className="hero">
        <h1>个人中心</h1>
        <p>查看自己的流量额度和 Clash Verge 订阅地址。</p>
      </section>

      <section className="toolbar">
        <span className="pill success">{status}</span>
        <button className="button secondary small" onClick={handleLogout}>
          退出登录
        </button>
      </section>

      <section className="grid">
        <article className="card span-12">
          <div className="stats">
            <div className="stat">
              <span className="muted">用户名</span>
              <strong>{profile?.username ?? "-"}</strong>
            </div>
            <div className="stat">
              <span className="muted">总流量</span>
              <strong>{profile?.totalTrafficGB ?? 0} GB</strong>
            </div>
            <div className="stat">
              <span className="muted">剩余流量</span>
              <strong>{profile?.remainingTrafficGB ?? 0} GB</strong>
            </div>
          </div>
        </article>

        <article className="card span-12">
          <h2>订阅地址</h2>
          <p>复制到 Clash Verge 的订阅设置中即可，客户端可以定时刷新。</p>
          <div className="inlineRow wrap">
            <code className="code long">{profile?.subscriptionUrl ?? "-"}</code>
            <button
              className="button"
              onClick={() => copy(profile?.subscriptionUrl ?? "", "订阅地址")}
              disabled={!profile?.subscriptionUrl}
            >
              复制订阅地址
            </button>
          </div>
        </article>

        <article className="card span-12">
          <h2>流量明细</h2>
          <p>当前已用流量来自 Hysteria Traffic Stats API 聚合结果。</p>
          <div className="notice">已用流量：{formatGB(profile?.usedTrafficBytes ?? 0)}</div>
        </article>
      </section>

      <div className="navRow">
        <Link href="/login" className="textLink">
          切换账号
        </Link>
        <Link href="/" className="textLink">
          返回首页
        </Link>
      </div>
    </main>
  );
}
