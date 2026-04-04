CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS "user_domain";

CREATE TYPE "user_domain"."UserRole" AS ENUM ('USER', 'ADMIN');

CREATE TABLE "user_domain"."users" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL,
  "name" TEXT,
  "avatarUrl" TEXT,
  "role" "user_domain"."UserRole" NOT NULL DEFAULT 'USER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "user_domain"."users"("email");
CREATE INDEX "users_email_idx" ON "user_domain"."users"("email");

CREATE TABLE "user_domain"."oauth_identities" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "provider" TEXT NOT NULL,
  "providerUserId" TEXT NOT NULL,
  "userId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "oauth_identities_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "oauth_identities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_domain"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "oauth_identities_provider_providerUserId_key" ON "user_domain"."oauth_identities"("provider", "providerUserId");
CREATE INDEX "oauth_identities_userId_idx" ON "user_domain"."oauth_identities"("userId");
