FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable

COPY . ./

RUN pnpm install --no-frozen-lockfile --filter @qode/photo-service...
RUN pnpm --filter @qode/photo-service run prisma:generate
RUN pnpm --filter @qode/photo-service run build
RUN cp -R services/photo-service/src/generated services/photo-service/dist/generated

FROM node:20-alpine AS runner
WORKDIR /app
RUN corepack enable

COPY --from=builder /app /app

EXPOSE 4002
CMD ["pnpm", "--filter", "@qode/photo-service", "run", "start"]
