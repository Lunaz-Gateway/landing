# syntax=docker/dockerfile:1
FROM oven/bun:1.4.2 AS base
WORKDIR /app
COPY package.json bun.lock ./

FROM base AS deps
RUN bun install --frozen-lockfile

FROM base AS prod-deps
RUN bun install --frozen-lockfile --production

FROM deps AS build
COPY . .
# VITE_* values are public and baked into the client bundle at build time:
# never pass secrets as build args.
ARG VITE_DEMO_URL=http://localhost:3000
ARG VITE_DOCS_URL=http://localhost:4321
ARG VITE_SALES_EMAIL=sales@lunaz.example
ARG VITE_MAGIC_PUBLISHABLE_KEY=
ENV VITE_DEMO_URL=$VITE_DEMO_URL VITE_DOCS_URL=$VITE_DOCS_URL VITE_SALES_EMAIL=$VITE_SALES_EMAIL VITE_MAGIC_PUBLISHABLE_KEY=$VITE_MAGIC_PUBLISHABLE_KEY
RUN bun run build

FROM gcr.io/distroless/nodejs22-debian12:nonroot
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
COPY --from=prod-deps --chown=nonroot:nonroot /app/node_modules ./node_modules
COPY --from=build --chown=nonroot:nonroot /app/dist ./dist
COPY --chown=nonroot:nonroot package.json server.mjs ./
USER nonroot
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["/nodejs/bin/node", "-e", "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["server.mjs"]
