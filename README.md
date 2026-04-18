# HyPanel

HyPanel is a self-hosted management panel for Hysteria users.

## Stack

- Go backend
- Next.js frontend
- PostgreSQL
- Docker Compose

## Features

- Admin login with verification code
- Verification-code based user registration
- Auto-generated username and password
- Subscription export for Clash Verge
- Traffic usage dashboard backed by Hysteria API

## Structure

- `backend`: Go API service
- `frontend`: Next.js web app
- `deploy`: Docker and bootstrap files

## Quick Start

1. Copy `.env.example` to `.env`
2. Fill in Hysteria API and JWT settings
3. Start the stack in the foreground with `docker compose --env-file .env -f deploy/docker-compose.yml up --build`

For split-domain deployments, set:
- `NEXT_PUBLIC_USER_API_BASE_URL` (e.g. `https://hy2.example.com/api/v1`)
- `NEXT_PUBLIC_ADMIN_API_BASE_URL` (e.g. `https://hy2-admin.example.com/api/v1`)

If these are empty, frontend falls back to `NEXT_PUBLIC_API_BASE_URL`.

The backend connects to the Hysteria API on the Docker host using `HYSTERIA_API_PORT`, so you only need to provide the host port exposed by your local Hysteria API.
For Hysteria's HTTP auth mode, HyPanel expects the incoming `auth` field in `username:password` format and returns the matched user ID to Hysteria.

## Common Commands

- Start in the foreground: `docker compose --env-file .env -f deploy/docker-compose.yml up --build`
- Start in the background: `docker compose --env-file .env -f deploy/docker-compose.yml up -d --build`
- Restart all services: `docker compose --env-file .env -f deploy/docker-compose.yml restart`
- Rebuild and restart frontend only: `docker compose --env-file .env -f deploy/docker-compose.yml up -d --build frontend`
- Rebuild and restart frontend + backend: `docker compose --env-file .env -f deploy/docker-compose.yml up -d --build frontend backend`
- Stop services: `docker compose --env-file .env -f deploy/docker-compose.yml stop`
- Stop and remove containers/network: `docker compose --env-file .env -f deploy/docker-compose.yml down`
- View service status: `docker compose --env-file .env -f deploy/docker-compose.yml ps`
- View logs: `docker compose --env-file .env -f deploy/docker-compose.yml logs -f`
