"use client";

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
  const [status, setStatus] = useState("正在同步你的流量数据");

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
      setStatus("个人信息加载失败，请重新登录");
      return;
    }

    const data = (await response.json()) as UserProfile;
    setProfile(data);
    setStatus("个人信息已同步");
  }

  async function copy(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    setStatus(`${label}已复制`);
  }

  function handleLogout() {
    window.localStorage.removeItem("hypanel_user_token");
    router.push("/auth");
  }

  return (
    <main className="userPortalPage">
      <div className="authGlow authGlowA" />
      <div className="authGlow authGlowB" />

      <section className="userPortalShell">
        <header className="userPortalHeader">
          <div>
            <span className="eyebrow">User Center</span>
            <h1>{profile?.username ?? "个人中心"}</h1>
            <p>查看流量额度、复制专属订阅地址，并在客户端中设置定时刷新。</p>
          </div>
          <div className="consoleHeaderMeta">
            <div className="statusBar inline">
              <span className="statusDot" />
              <span>{status}</span>
            </div>
            <button className="ghostButton" onClick={handleLogout}>
              退出登录
            </button>
          </div>
        </header>

        <section className="portalMetrics">
          <article className="metricCard large">
            <span>总流量</span>
            <strong>{profile?.totalTrafficGB ?? 0} GB</strong>
            <small>套餐总额度</small>
          </article>
          <article className="metricCard large">
            <span>剩余流量</span>
            <strong>{profile?.remainingTrafficGB ?? 0} GB</strong>
            <small>实时扣减</small>
          </article>
          <article className="metricCard large">
            <span>已用流量</span>
            <strong>{formatGB(profile?.usedTrafficBytes ?? 0)}</strong>
            <small>来自 Hysteria 统计</small>
          </article>
        </section>

        <section className="portalGrid">
          <article className="glassCard spanWide">
            <div className="sectionHeading tight">
              <div>
                <h2>订阅地址</h2>
                <p>推荐直接导入 Clash Verge 订阅，后续变更会自动同步。</p>
              </div>
              <button
                className="heroButton compact"
                onClick={() => copy(profile?.subscriptionUrl ?? "", "订阅地址")}
                disabled={!profile?.subscriptionUrl}
              >
                复制订阅
              </button>
            </div>
            <div className="copyPanel">
              <code>{profile?.subscriptionUrl ?? "-"}</code>
            </div>
          </article>

          <article className="glassCard">
            <div className="sectionHeading tight">
              <div>
                <h2>使用说明</h2>
                <p>保持页面结构简洁，但细节更完整。</p>
              </div>
            </div>
            <div className="guideList">
              <div className="guideItem">
                <strong>1</strong>
                <span>将订阅地址导入 Clash Verge。</span>
              </div>
              <div className="guideItem">
                <strong>2</strong>
                <span>建议开启自动刷新，确保密码和节点配置保持最新。</span>
              </div>
              <div className="guideItem">
                <strong>3</strong>
                <span>若剩余流量异常下降，可联系管理员核对账号状态。</span>
              </div>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
