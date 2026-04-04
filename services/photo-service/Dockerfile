FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable

COPY . ./

RUN pnpm install --no-frozen-lockfile
RUN pnpm prisma:generate
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
RUN corepack enable

COPY --from=builder /app /app

EXPOSE 4002
CMD ["pnpm", "start"]
