# HyPanel

[简体中文](./README.md) / English

HyPanel is a lightweight self-hosted management panel for Hysteria2, with both user and admin web UI.

## Highlights

- Admin login, verification-code generation, and user management
- User registration/login with verification code
- One-click reset for login password and proxy password
- Subscription URL delivery (Clash config)
- Traffic and online status from Hysteria API

## UI Preview

### User Side

![User Register](./docs/image/ui_user_reg.png)

![User Home](./docs/image/ui_user_home.png)

### Admin Side

![Admin Login](./docs/image/ui_admin_login.png)

![Admin Home](./docs/image/ui_admin_home.png)

## Quick Deploy (Docker Compose)

1. Create env file

```bash
cp .env.example .env
```

2. Edit `.env` (minimum required)

- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `ADMIN_BOOTSTRAP_EMAIL`
- `ADMIN_BOOTSTRAP_PASSWORD`
- `HYSTERIA_API_TOKEN`
- `HYSTERIA_SERVER`
- `HYSTERIA_SNI`
- `HYSTERIA_OBFS_PASSWORD`
- `SUBSCRIPTION_BASE_URL` (recommended full URL, e.g. `https://your-domain.com/api/v1/subscriptions`)

3. Start services

```bash
docker compose --env-file .env -f deploy/docker-compose.yml up -d --build
```

4. Access

- Frontend: `http://<your-server-ip>:3000`
- Backend health: `http://<your-server-ip>:8080/api/v1/health`

## Domain / Reverse Proxy (Short)

- Single domain:
  - `NEXT_PUBLIC_API_BASE_URL=/api/v1`

- Split user/admin domains:
  - `NEXT_PUBLIC_USER_API_BASE_URL=https://user.example.com/api/v1`
  - `NEXT_PUBLIC_ADMIN_API_BASE_URL=https://admin.example.com/api/v1`

If user/admin URLs are not set, frontend falls back to `NEXT_PUBLIC_API_BASE_URL`.

## Common Commands

```bash
# Status
docker compose --env-file .env -f deploy/docker-compose.yml ps

# Logs
docker compose --env-file .env -f deploy/docker-compose.yml logs -f

# Restart
docker compose --env-file .env -f deploy/docker-compose.yml restart

# Stop and remove containers/network
docker compose --env-file .env -f deploy/docker-compose.yml down
```

## Project Structure

- `backend`: Go API
- `frontend`: Next.js
- `deploy`: docker-compose files

## Disclaimer

This project is developed for educational and research purposes only. The developers do not endorse or encourage any illegal use of this software. Users are solely responsible for ensuring compliance with applicable laws and regulations in their jurisdiction. The developers assume no liability for any misuse of this project.