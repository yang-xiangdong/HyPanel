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
3. Run `docker compose -f deploy/docker-compose.yml up --build`
