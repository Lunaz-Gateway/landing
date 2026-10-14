# Lunaz landing

Marketing site and developer dashboard for Lunaz, a Zcash payment gateway. Built with TanStack Start (React 19), Vite 8, Tailwind 4 and Biome. The package manager is bun.

## Features

- Marketing page at `/` with a link to the Sunday Market demo.
- Passwordless sign-in with email OTP via Magic (`/dashboard/login`; `/dashboard/signup` redirects there). First sign-in creates the account.
- Viewing key (UFVK) onboarding, so the gateway can watch for payments without spend authority.
- API keys: create (shown once) and revoke.
- Webhook endpoint, signing secret rotation, test delivery and a delivery log.
- Invoices list with status, received and overpaid amounts.
- Accountant CSV export.
- Withdraw to bank (`/dashboard/withdraw`): quote ZEC to IDR or USD, the partner step for identity and bank, the deposit details and a live status timeline. The partner is a mock for now (TransFi sandbox next). The dashboard sends only the bank name and the last 4 digits of the account number.
- Fees (`/dashboard/fees`): outstanding fees, rates, charged/paid/settled totals and settlement history; "Pay outstanding fees" creates a Lunaz invoice in ZEC (status polled every 3 s). No plans or limits.
- Settings page and a getting-started timeline for new accounts.

## Architecture

```
browser --> TanStack Start server functions (src/server/dash.ts) --> core-service (/v1/...)
```

- The browser never talks to core-service. All calls go through server functions.
- The core-service session token is stored in an `httpOnly`, `SameSite=Lax` cookie (`lunaz_session`, 7 days). It is `Secure` when `NODE_ENV=production`. Client code never sees the token.
- A 401 from core-service clears the cookie.
- Auth: the login page loads `magic-sdk` lazily and runs `loginWithEmailOTP`. The resulting DID token goes to the `signInWithMagic` server function, which verifies it with `@magic-sdk/admin`, reads the email, and calls core-service `POST /v1/auth/exchange` with `LUNAZ_INTERNAL_TOKEN` to get the session token. Magic is used for identity only; its session is logged out right after.

## Environment

| Variable | Where | Description |
| --- | --- | --- |
| `LUNAZ_API_URL` | server, runtime | core-service base URL (default `http://127.0.0.1:8097`) |
| `MAGIC_SECRET_KEY` | server, runtime, secret | Magic secret key (`sk_…`), used to verify DID tokens |
| `LUNAZ_INTERNAL_TOKEN` | server, runtime, secret | Bearer token for core-service `/v1/auth/exchange` (must match core-service) |
| `PUBLIC_ORIGIN` | server, runtime | Public origin behind a TLS proxy (e.g. `https://lunaz.alwaysbedream.dev`). The CSRF check compares `Origin`/`Referer` to it when the browser sends no `Sec-Fetch-Site` header; without it the internal `http://` request URL is used |
| `HSTS` | server, runtime | `1` adds `Strict-Transport-Security: max-age=31536000; includeSubDomains`. Better set at the TLS proxy |
| `VITE_MAGIC_PUBLISHABLE_KEY` | public, build time | Magic publishable key (`pk_…`); sign-in shows "not configured" if empty |
| `VITE_DEMO_URL` | public, build time | URL of the demo app behind "Try the demo" (default `http://localhost:3000`) |
| `VITE_SALES_EMAIL` | public, build time | Address behind the Enterprise "Contact us" button (default `sales@lunaz.example`) |
| `VITE_DOCS_URL` | public, build time | URL of the documentation site behind "Docs" (default `http://localhost:4321`) |

`VITE_*` values are baked into the client bundle at build time and are public. Do not put secrets there.

## Local development

```bash
cp .env.example .env
bun install
bun run dev        # http://localhost:3001 (the demo app uses 3000)
bun run check      # biome
```

## Production build and Docker

`bun run build` writes `dist/client` (static assets) and `dist/server/server.js` (a fetch handler). `server.mjs` serves both with [srvx](https://srvx.h3.dev) on `HOST:PORT` (default `0.0.0.0:3000`). It runs on Node 22.

The image is multi-stage and the final stage is `distroless/nodejs22-debian12:nonroot`: no shell, no package manager, non-root user. `.env*` files are excluded by `.dockerignore` and never enter an image layer. It has a built-in `HEALTHCHECK` that requests `/`.

```bash
docker build --build-arg VITE_MAGIC_PUBLISHABLE_KEY=pk_live_xxx --build-arg VITE_DEMO_URL=https://demo.example.com --build-arg VITE_DOCS_URL=https://docs.example.com -t lunaz-landing .

docker run -d --name lunaz-landing --read-only --tmpfs /tmp --cap-drop ALL \
  --security-opt no-new-privileges:true --pids-limit 256 --memory 512m \
  -p 127.0.0.1:3000:3000 -e LUNAZ_API_URL=http://core:8080 -e MAGIC_SECRET_KEY -e LUNAZ_INTERNAL_TOKEN \
  --restart unless-stopped lunaz-landing
```

Compose:

```yaml
services:
  landing:
    build:
      context: .
      args:
        VITE_MAGIC_PUBLISHABLE_KEY: pk_live_xxx
        VITE_DEMO_URL: https://demo.example.com
        VITE_DOCS_URL: https://docs.example.com
    read_only: true
    tmpfs: [/tmp]
    cap_drop: [ALL]
    security_opt: ["no-new-privileges:true"]
    pids_limit: 256
    mem_limit: 512m
    ports: ["127.0.0.1:3000:3000"]
    environment:
      LUNAZ_API_URL: http://core:8080
      MAGIC_SECRET_KEY: ${MAGIC_SECRET_KEY}
      LUNAZ_INTERNAL_TOKEN: ${LUNAZ_INTERNAL_TOKEN}
    restart: unless-stopped
```
