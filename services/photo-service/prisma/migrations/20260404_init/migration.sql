CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS "photo_domain";

CREATE TABLE "photo_domain"."photos" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "publicId" TEXT NOT NULL,
  "secureUrl" TEXT NOT NULL,
  "format" TEXT NOT NULL,
  "bytes" INTEGER NOT NULL,
  "width" INTEGER NOT NULL,
  "height" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "photos_createdAt_idx" ON "photo_domain"."photos"("createdAt" DESC);
CREATE INDEX "photos_userId_idx" ON "photo_domain"."photos"("userId");

CREATE TABLE "photo_domain"."comments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "photoId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "comments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "comments_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "photo_domain"."photos"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "comments_photoId_createdAt_idx" ON "photo_domain"."comments"("photoId", "createdAt" ASC);
CREATE INDEX "comments_userId_idx" ON "photo_domain"."comments"("userId");
