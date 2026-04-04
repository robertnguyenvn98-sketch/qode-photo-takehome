FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY services/user-service ./services/user-service

RUN pnpm install --frozen-lockfile --filter @qode/user-service...
RUN pnpm --filter @qode/user-service prisma:generate
RUN pnpm --filter @qode/user-service build

FROM node:20-alpine AS runner
WORKDIR /app
RUN corepack enable

COPY --from=builder /app /app

EXPOSE 4001
CMD ["pnpm", "--filter", "@qode/user-service", "start"]
