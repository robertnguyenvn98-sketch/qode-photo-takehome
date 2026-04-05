FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable

COPY . ./

RUN pnpm install --no-frozen-lockfile --filter @qode/user-service...
RUN pnpm --filter @qode/user-service run prisma:generate
RUN pnpm --filter @qode/user-service run build

FROM node:20-alpine AS runner
WORKDIR /app/services/user-service
RUN corepack enable

COPY --from=builder /app /app

EXPOSE 4001
ENTRYPOINT ["node", "dist/main.js"]
