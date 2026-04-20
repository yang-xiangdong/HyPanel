# HyPanel

简体中文 / [English](./README.en.md)

HyPanel 是一个面向 Hysteria2 的轻量自托管管理面板，包含用户端与管理员端。

## 功能概览

- 管理员登录、注册码生成、用户管理
- 用户注册码注册与登录
- 一键重置登录密码与代理密码
- 订阅链接下发（Clash 配置）
- 基于 Hysteria API 的流量与在线状态展示

## UI 预览

### 用户端

![用户注册](./docs/image/ui_user_reg.png)

![用户主页](./docs/image/ui_user_home.png)

### 管理端

![管理员登录](./docs/image/ui_admin_login.png)

![管理员主页](./docs/image/ui_admin_home.png)

## 快速部署（Docker Compose）

1. 准备配置

```bash
cp .env.example .env
```

2. 编辑 `.env`（最少修改）

- `POSTGRES_PASSWORD`：数据库密码，自行填写
- `JWT_SECRET`：JWT 签名密钥，自行填写
- `ADMIN_BOOTSTRAP_EMAIL`：初始化管理员邮箱（首次启动创建）
- `ADMIN_BOOTSTRAP_PASSWORD`：初始化管理员密码（首次启动创建）
- `HYSTERIA_API_TOKEN`：Hysteria API 鉴权 Token（服务端与面板通信用）
- `HYSTERIA_SERVER`：Hysteria 服务地址（域名:端口）
- `HYSTERIA_SNI`：TLS SNI（通常填域名）
- `HYSTERIA_OBFS_PASSWORD`：：Hysteria 混淆密码
- `SUBSCRIPTION_BASE_URL`：生成的订阅链接，例如 `https://your-domain.com/api/v1/subscriptions`

3. 启动服务

```bash
docker compose --env-file .env -f deploy/docker-compose.yml up -d --build
```

4. 访问

- 前端：`http://<你的服务器IP>:3000`
- 后端健康检查：`http://<你的服务器IP>:8080/api/v1/health`

## 域名/反代说明（简版）

- 单域名：
  - `NEXT_PUBLIC_API_BASE_URL=/api/v1`

- 用户端/管理端分域名：
  - `NEXT_PUBLIC_USER_API_BASE_URL=https://user.example.com/api/v1`
  - `NEXT_PUBLIC_ADMIN_API_BASE_URL=https://admin.example.com/api/v1`

如未单独设置用户端/管理端变量，前端会回退到 `NEXT_PUBLIC_API_BASE_URL`。

## 常用命令

```bash
# 查看状态
docker compose --env-file .env -f deploy/docker-compose.yml ps

# 查看日志
docker compose --env-file .env -f deploy/docker-compose.yml logs -f

# 重启
docker compose --env-file .env -f deploy/docker-compose.yml restart

# 停止并删除容器/网络
docker compose --env-file .env -f deploy/docker-compose.yml down
```

## 开发目录

- `backend`：Go API
- `frontend`：Next.js
- `deploy`：Compose 编排文件

## 免责声明

本项目仅供学习和研究网络技术之用。使用者应当遵守所在地区的法律法规，开发者不对任何人使用本项目所产生的后果承担责任。