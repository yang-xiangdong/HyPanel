# Architecture

## Roles

- Admin
  - Login with bootstrap account
  - Generate 1-hour verification codes
  - View user list and traffic statistics
- User
  - Register with verification code only
  - Receive auto-generated username and password
  - Login and view subscription, total traffic, and remaining traffic

## Backend Modules

- `internal/config`
  - Load environment variables
- `internal/store`
  - GORM models and database bootstrap
- `internal/auth`
  - JWT token issuing
- `internal/hysteria`
  - Hysteria API client abstraction
- `internal/handler`
  - REST API endpoints

## Database Tables

- `admins`
- `verification_codes`
- `users`
- `traffic_snapshots`

## API Draft

- `POST /api/v1/admin/login`
- `POST /api/v1/admin/codes`
- `GET /api/v1/admin/dashboard`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/me`
- `GET /api/v1/subscriptions/:token`

## Next Steps

1. Configure Hysteria `auth.type: http` to call `POST /api/v1/hysteria/auth`.
2. Add scheduled traffic sync job and persist snapshots.
3. Encrypt or otherwise protect `ProxyAuthSecret` at rest.
4. Add admin actions such as disable user, reset password, and revoke subscription.

## Hysteria Auth Integration

Recommended server config pattern:

```yaml
auth:
  type: http
  http:
    url: http://your-hypanel-host:8080/api/v1/hysteria/auth
    insecure: false
```

If you set `HYSTERIA_AUTH_SECRET`, send the same value in the Hysteria request header:

```text
Authorization: <HYSTERIA_AUTH_SECRET>
```

This header is an optional hardening layer for deployments where you place HyPanel behind a reverse proxy that can inject the header. It is not guaranteed by Hysteria's built-in HTTP auth callback itself.

HyPanel validates:

- username and password
- user status
- traffic quota exhaustion

If valid, it returns the username as the Hysteria client ID so Traffic Stats API can aggregate per user consistently.
