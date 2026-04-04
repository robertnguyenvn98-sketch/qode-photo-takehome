FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web ./apps/web

RUN pnpm install --frozen-lockfile --filter @qode/web...
RUN pnpm --filter @qode/web build

FROM node:20-alpine AS runner
WORKDIR /app
RUN corepack enable
ENV NODE_ENV=production

COPY --from=builder /app /app

EXPOSE 3000
CMD ["pnpm", "--filter", "@qode/web", "start"]
