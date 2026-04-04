# Deployment Plan (Vercel + Railway + Neon + Cloudinary)

## Target Topology

- Web: Vercel (Next.js app)
- User Service: Railway service (Docker)
- Photo Service: Railway service (Docker)
- Database: Neon PostgreSQL (single database, separate schemas)
- Media: Cloudinary

## 1) Neon Setup

1. Create one Neon project and database (for example `qode_photo`).
2. Keep one DB and use two schemas:
- `user_domain`
- `photo_domain`
3. Copy the pooled connection string and create two env values:
- `USER_SERVICE_DATABASE_URL` with `?schema=user_domain`
- `PHOTO_SERVICE_DATABASE_URL` with `?schema=photo_domain`

## 2) Cloudinary Setup

1. Create a Cloudinary product environment.
2. Save these values for `photo-service`:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- optional: `CLOUDINARY_UPLOAD_FOLDER` (for example `qode-photo-takehome`)

## 3) Railway Services

Deploy two services from this repository in one Railway project:

- `user-service`
  - Root Directory: `.`
  - Dockerfile Path: `services/user-service/Dockerfile`
  - Internal port: `4001`

- `photo-service`
  - Root Directory: `.`
  - Dockerfile Path: `services/photo-service/Dockerfile`
  - Internal port: `4002`

Both service Dockerfiles build from monorepo root context and use pnpm workspace filtering.

Set environment variables in Railway:

### user-service env

- `PORT=4001`
- `DATABASE_URL=${USER_SERVICE_DATABASE_URL}`
- `INTERNAL_JWT_SECRET=<shared-secret>`
- `CORS_ORIGINS=https://<your-vercel-domain>`

### photo-service env

- `PORT=4002`
- `DATABASE_URL=${PHOTO_SERVICE_DATABASE_URL}`
- `INTERNAL_JWT_SECRET=<shared-secret>`
- `USER_SERVICE_URL=https://<user-service-railway-domain>`
- `CORS_ORIGINS=https://<your-vercel-domain>`
- `CLOUDINARY_CLOUD_NAME=<value>`
- `CLOUDINARY_API_KEY=<value>`
- `CLOUDINARY_API_SECRET=<value>`
- `CLOUDINARY_UPLOAD_FOLDER=qode-photo-takehome`

## 4) Prisma Migrations in Production

Before traffic cutover, run migration deploy for both services:

```bash
pnpm --filter @qode/user-service prisma:migrate:deploy
pnpm --filter @qode/photo-service prisma:migrate:deploy
```

In GitHub Actions CD this is automated in `.github/workflows/cd.yml`.

## 5) Vercel Web Deployment

Deploy `apps/web` to Vercel.

Set Vercel environment variables:

- `NEXTAUTH_URL=https://<your-vercel-domain>`
- `NEXTAUTH_SECRET=<secure-random-value>`
- `GOOGLE_CLIENT_ID=<value>`
- `GOOGLE_CLIENT_SECRET=<value>`
- `USER_SERVICE_URL=https://<user-service-railway-domain>`
- `PHOTO_SERVICE_URL=https://<photo-service-railway-domain>`
- `INTERNAL_JWT_SECRET=<shared-secret>`

## 6) Google OAuth Callback Verification

In Google Cloud Console OAuth Client settings, add:

- Authorized JavaScript origins:
  - `https://<your-vercel-domain>`
- Authorized redirect URIs:
  - `https://<your-vercel-domain>/api/auth/callback/google`

Also ensure `NEXTAUTH_URL` exactly matches your deployed Vercel URL.

## 7) CI/CD with Railway Deploy Hooks

In Railway, generate one deploy hook URL for each backend service.

Add these secrets in GitHub Actions:

- `USER_SERVICE_RAILWAY_DEPLOY_HOOK_URL`
- `PHOTO_SERVICE_RAILWAY_DEPLOY_HOOK_URL`

The CD workflow sequence is:

1. Run Prisma migration deploy for both services.
2. Trigger Railway deploy hooks for user-service and photo-service.
3. Trigger web deploy hook.
4. Run web/backend health checks.

## 8) Lockdown Checklist

- Keep `INTERNAL_JWT_SECRET` identical across web, user-service, photo-service.
- Restrict `CORS_ORIGINS` on both backend services to only the Vercel domain.
- Never expose database credentials or Cloudinary secrets in frontend env.
- Use platform secret managers (Vercel/Railway/GitHub Secrets), not plaintext files.

## 9) Healthcheck Validation

After deployment:

- `GET https://<user-service-railway-domain>/health`
- `GET https://<photo-service-railway-domain>/health`
- `GET https://<your-vercel-domain>/api/me` (with authenticated session)
