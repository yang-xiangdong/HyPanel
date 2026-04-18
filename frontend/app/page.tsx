import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <h1>HyPanel</h1>
        <p>Hysteria 的简洁可视化管理平台。</p>
      </section>

      <section className="grid">
        <article className="card span-4">
          <h2>管理员入口</h2>
          <p>登录后台、生成验证码、查看流量统计。</p>
          <Link className="button" href="/admin/login">
            进入管理员登录
          </Link>
        </article>

        <article className="card span-4">
          <h2>用户注册</h2>
          <p>使用验证码注册，系统自动分配用户名和密码。</p>
          <Link className="button" href="/register">
            前往注册
          </Link>
        </article>

        <article className="card span-4">
          <h2>用户登录</h2>
          <p>登录后查看自己的流量、剩余额度和订阅地址。</p>
          <Link className="button secondary" href="/login">
            前往登录
          </Link>
        </article>
      </section>
    </main>
  );
}
