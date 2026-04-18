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

The backend connects to the Hysteria API on the Docker host using `HYSTERIA_API_PORT`, so you only need to provide the host port exposed by your local Hysteria API.
For Hysteria's HTTP auth mode, HyPanel expects the incoming `auth` field in `username:password` format and returns the matched user ID to Hysteria.

## Common Commands

- Start in the foreground: `docker compose --env-file .env -f deploy/docker-compose.yml up --build`
- Start in the background: `docker compose --env-file .env -f deploy/docker-compose.yml up -d --build`
- Stop services: `docker compose --env-file .env -f deploy/docker-compose.yml stop`
- Stop and remove containers/network: `docker compose --env-file .env -f deploy/docker-compose.yml down`
- View service status: `docker compose --env-file .env -f deploy/docker-compose.yml ps`
- View logs: `docker compose --env-file .env -f deploy/docker-compose.yml logs -f`
