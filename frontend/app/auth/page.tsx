"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type RegisterResponse = {
  username: string;
  password: string;
  subscriptionUrl: string;
  totalTrafficGB: number;
  remainingTrafficGB: number;
};

const apiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

function BrandMark() {
  return (
    <div className="brandMark" aria-hidden="true">
      <svg viewBox="0 0 48 48" className="brandMarkIcon">
        <rect x="2" y="2" width="44" height="44" rx="12" />
        <path d="M14 14h20l-12 20h12" />
      </svg>
    </div>
  );
}

function FieldIcon({ type }: { type: "user" | "lock" | "ticket" }) {
  if (type === "user") {
    return (
      <svg viewBox="0 0 24 24" className="fieldIcon" aria-hidden="true">
        <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z" />
      </svg>
    );
  }

  if (type === "lock") {
    return (
      <svg viewBox="0 0 24 24" className="fieldIcon" aria-hidden="true">
        <path d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-7-2a2 2 0 0 1 4 0v2h-4Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="fieldIcon" aria-hidden="true">
      <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6H20v5.5a2.5 2.5 0 0 1-2.5 2.5H15l-2.5 2.5L10 14H6.5A2.5 2.5 0 0 1 4 11.5Z" />
    </svg>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("输入账号密码登录，或切换到注册使用验证码开通。");
  const [result, setResult] = useState<RegisterResponse | null>(null);
  const [busy, setBusy] = useState(false);

  const title = useMemo(
    () => (mode === "login" ? "欢迎来到 HyPanel" : "使用验证码开通账号"),
    [mode],
  );

  async function handleLogin() {
    setBusy(true);
    setResult(null);
    setStatus("正在验证账号...");

    try {
      const response = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        setStatus("登录失败，请检查用户名和密码。");
        return;
      }

      const data = (await response.json()) as { token: string };
      window.localStorage.setItem("hypanel_user_token", data.token);
      window.localStorage.setItem("hypanel_user_name", username);
      router.push("/me");
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister() {
    setBusy(true);
    setResult(null);
    setStatus("正在校验验证码...");

    try {
      const response = await fetch(`${apiBase}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        setStatus("验证码无效或已过期，请联系管理员重新生成。");
        return;
      }

      const data = (await response.json()) as RegisterResponse;
      setResult(data);
      setUsername(data.username);
      setPassword(data.password);
      setMode("login");
      setStatus("账号已生成，使用下方账号密码即可直接登录。");
    } finally {
      setBusy(false);
    }
  }

  async function copy(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    setStatus(`${label}已复制。`);
  }

  return (
    <main className="authPage">
      <section className="authShell">
        <div className="authIntro">
          <BrandMark />
          <span className="eyebrow">HyPanel User Portal</span>
          <h1>{title}</h1>
          <div className="authSwitch">
            <button
              className={`segment ${mode === "login" ? "active" : ""}`}
              onClick={() => setMode("login")}
            >
              登录
            </button>
            <button
              className={`segment ${mode === "register" ? "active" : ""}`}
              onClick={() => setMode("register")}
            >
              注册
            </button>
          </div>
        </div>

        <section className="authCard">
          <div className="statusBar">
            <span className="statusDot" />
            <span>{status}</span>
          </div>

          {mode === "login" ? (
            <div className="stack">
              <label className="field">
                <span className="fieldLabel">用户名</span>
                <div className="fieldInputWrap">
                  <FieldIcon type="user" />
                  <input
                    className="fieldInput"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="输入系统分配的用户名"
                  />
                </div>
              </label>

              <label className="field">
                <span className="fieldLabel">密码</span>
                <div className="fieldInputWrap">
                  <FieldIcon type="lock" />
                  <input
                    className="fieldInput"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="输入你的密码"
                  />
                </div>
              </label>

              <button className="heroButton" onClick={handleLogin} disabled={busy}>
                {busy ? "登录中..." : "进入个人中心"}
              </button>
            </div>
          ) : (
            <div className="stack">
              <label className="field">
                <span className="fieldLabel">验证码</span>
                <div className="fieldInputWrap">
                  <FieldIcon type="ticket" />
                  <input
                    className="fieldInput"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    placeholder="输入管理员提供的 6 位验证码"
                  />
                </div>
              </label>

              <button className="heroButton" onClick={handleRegister} disabled={busy}>
                {busy ? "注册中..." : "生成账号"}
              </button>
            </div>
          )}

          {result ? (
            <div className="credentialCard">
              <div className="credentialHead">
                <strong>账号已开通</strong>
                <span>现在可以直接登录，也可以先复制订阅地址。</span>
              </div>
              <div className="credentialGrid">
                <div className="miniPanel">
                  <span>用户名</span>
                  <strong>{result.username}</strong>
                </div>
                <div className="miniPanel">
                  <span>初始密码</span>
                  <strong>{result.password}</strong>
                </div>
              </div>
              <div className="copyPanel">
                <code>{result.subscriptionUrl}</code>
                <button className="ghostButton" onClick={() => copy(result.subscriptionUrl, "订阅地址")}>
                  复制订阅地址
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}
