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

## Prisma Workflow

Each backend service keeps its own Prisma schema and migration history.

Apply migrations locally after the database is up:

```bash
pnpm --filter @qode/user-service prisma:migrate
pnpm --filter @qode/photo-service prisma:migrate
```

Seed minimal local data if you need demo records:

```bash
pnpm --filter @qode/user-service prisma:seed
pnpm --filter @qode/photo-service prisma:seed
```

## CI/CD (GitHub Actions)

This repository uses two workflows:

- `CI` on pull requests to `main`
  - install dependencies
  - generate Prisma clients
  - run typecheck
  - run lint
  - run tests
  - build all projects

- `CD` on push to `main`
  - build and push container images to GHCR for:
    - web
    - user-service
    - photo-service
  - run Prisma `migrate deploy` for user-service and photo-service
  - trigger deployment hooks for web and both backend services
  - run post-deploy health checks

### Required GitHub Secrets

Core secrets:

- `USER_SERVICE_DATABASE_URL`
- `PHOTO_SERVICE_DATABASE_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_SECRET`
- `INTERNAL_JWT_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Deployment hook secrets:

- `WEB_DEPLOY_HOOK_URL`
- `USER_SERVICE_DEPLOY_HOOK_URL`
- `PHOTO_SERVICE_DEPLOY_HOOK_URL`

Healthcheck secrets:

- `WEB_HEALTHCHECK_URL`
- `USER_SERVICE_HEALTHCHECK_URL`
- `PHOTO_SERVICE_HEALTHCHECK_URL`

## Production Deployment (Step 14)

Target topology:

- Web: Vercel
- User service: Render (Docker)
- Photo service: Render (Docker)
- PostgreSQL: Neon
- Media storage: Cloudinary

Detailed checklist and platform-by-platform setup:

- `docs/deployment-plan.md`

Render blueprint:

- `render.yaml`

### Production Configuration Notes

- Set `NEXTAUTH_URL` to your exact Vercel production URL.
- Add both callback URLs in Google OAuth:
  - `https://<your-vercel-domain>/api/auth/callback/google`
  - `http://localhost:3000/api/auth/callback/google`
- Use a strong shared `INTERNAL_JWT_SECRET` for web, user-service, and photo-service.
- Lock down `CORS_ORIGINS` in both backend services to your web origin only.
- Set `USER_SERVICE_URL` and `PHOTO_SERVICE_URL` in web to public Render service URLs.
- Use Neon pooled connection strings for runtime `DATABASE_URL` values.
- Enable `prisma:migrate:deploy` in backend startup/release flow before serving traffic.

## Stop Local Infrastructure

```bash
docker compose down
```

If you also want to remove database data:

```bash
docker compose down -v
```
