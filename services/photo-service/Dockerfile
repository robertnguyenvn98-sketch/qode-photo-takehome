FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable

COPY . ./

RUN pnpm install --no-frozen-lockfile --filter @qode/photo-service...
RUN pnpm --filter @qode/photo-service run prisma:generate
RUN pnpm --filter @qode/photo-service run build
RUN mkdir -p services/photo-service/dist/generated \
	&& cp -R services/photo-service/src/generated/prisma services/photo-service/dist/generated/

FROM node:20-alpine AS runner
WORKDIR /app/services/photo-service
RUN corepack enable

COPY --from=builder /app /app

EXPOSE 4002
ENTRYPOINT ["node", "dist/main.js"]
