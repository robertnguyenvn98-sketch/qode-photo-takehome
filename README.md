# qode-photo-takehome

Local development infrastructure for a Next.js web app and two Nest services.

## Services and Ports

- Web (Next.js): `3000`
- User service (Nest): `4001`
- Photo service (Nest): `4002`
- PostgreSQL: `5432`

## Prerequisites

- Node.js 20+
- pnpm 10+
- Docker Desktop

## Start Local Infrastructure

1. Install dependencies:

```bash
pnpm install
```

2. Start PostgreSQL:

```bash
docker compose up -d
```

This bootstraps one Postgres instance and creates two schemas automatically:
- `user_domain`
- `photo_domain`

3. Start service processes:

```bash
pnpm --filter @qode/user-service dev
pnpm --filter @qode/photo-service dev
```

4. Verify health endpoints:

```bash
curl http://localhost:4001/health
curl http://localhost:4002/health
```

Expected response shape:

```json
{
  "status": "ok",
  "version": "0.1.0"
}
```

## Stop Local Infrastructure

```bash
docker compose down
```

If you also want to remove database data:

```bash
docker compose down -v
```
