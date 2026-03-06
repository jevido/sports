FROM oven/bun:1.3.8 AS builder
WORKDIR /app

COPY package.json bun.lock .
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM oven/bun:1.3.8-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV SQLITE_PATH=/app/data/sports.sqlite

RUN mkdir -p /app/data && chown -R bun:bun /app/data

COPY --from=builder --chown=bun:bun /app/build ./build
COPY --from=builder --chown=bun:bun /app/node_modules ./node_modules
COPY --from=builder --chown=bun:bun /app/package.json ./package.json

USER bun
VOLUME ["/app/data"]

EXPOSE 3000
CMD ["bun", "build/index.js"]
