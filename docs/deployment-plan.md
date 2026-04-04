# Deployment Plan (Vercel + Fly.io + Neon + Cloudinary)

## Target Topology

- Web: Vercel (Next.js app)
- User Service: Fly.io app (Docker)
- Photo Service: Fly.io app (Docker)
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

## 3) Fly.io Services

Deploy two apps from this repository:

- `user-service`
  - App config: `services/user-service/fly.toml`
  - Dockerfile path: `services/user-service/Dockerfile`
  - Internal port: `4001`

- `photo-service`
  - App config: `services/photo-service/fly.toml`
  - Dockerfile path: `services/photo-service/Dockerfile`
  - Internal port: `4002`

Set environment variables in Fly secrets:

### user-service env

- `PORT=4001`
- `DATABASE_URL=${USER_SERVICE_DATABASE_URL}`
- `INTERNAL_JWT_SECRET=<shared-secret>`
- `CORS_ORIGINS=https://<your-vercel-domain>`
- optional: `PRIMARY_REGION=<closest-fly-region>`

### photo-service env

- `PORT=4002`
- `DATABASE_URL=${PHOTO_SERVICE_DATABASE_URL}`
- `INTERNAL_JWT_SECRET=<shared-secret>`
- `USER_SERVICE_URL=https://<user-service-fly-domain>`
- `CORS_ORIGINS=https://<your-vercel-domain>`
- `CLOUDINARY_CLOUD_NAME=<value>`
- `CLOUDINARY_API_KEY=<value>`
- `CLOUDINARY_API_SECRET=<value>`
- `CLOUDINARY_UPLOAD_FOLDER=qode-photo-takehome`
- optional: `PRIMARY_REGION=<closest-fly-region>`

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
- `USER_SERVICE_URL=https://<user-service-fly-domain>`
- `PHOTO_SERVICE_URL=https://<photo-service-fly-domain>`
- `INTERNAL_JWT_SECRET=<shared-secret>`

## 6) Google OAuth Callback Verification

In Google Cloud Console OAuth Client settings, add:

- Authorized JavaScript origins:
  - `https://<your-vercel-domain>`
- Authorized redirect URIs:
  - `https://<your-vercel-domain>/api/auth/callback/google`

Also ensure `NEXTAUTH_URL` exactly matches your deployed Vercel URL.

## 7) Lockdown Checklist

- Keep `INTERNAL_JWT_SECRET` identical across web, user-service, photo-service.
- Restrict `CORS_ORIGINS` on both backend services to only the Vercel domain.
- Never expose database credentials or Cloudinary secrets in frontend env.
- Use platform secret managers (Vercel/Fly/GitHub Secrets), not plaintext files.

## 8) Healthcheck Validation

After deployment:

- `GET https://<user-service-fly-domain>/health`
- `GET https://<photo-service-fly-domain>/health`
- `GET https://<your-vercel-domain>/api/me` (with authenticated session)
