FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY services/photo-service ./services/photo-service

RUN pnpm install --frozen-lockfile --filter @qode/photo-service...
RUN pnpm --filter @qode/photo-service prisma:generate
RUN pnpm --filter @qode/photo-service build

FROM node:20-alpine AS runner
WORKDIR /app
RUN corepack enable

COPY --from=builder /app /app

EXPOSE 4002
CMD ["pnpm", "--filter", "@qode/photo-service", "start"]
