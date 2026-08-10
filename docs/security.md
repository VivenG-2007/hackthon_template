# Security

## Baseline, applied on every backend service

- `helmet()` for standard security headers
- CORS locked to `CORS_ORIGINS` (comma-separated allow-list), `credentials: true`
- `express-rate-limit` on every route (Redis-backed on main-service so limits hold across
  multiple instances; in-memory on auth-service/ai-storage-service — switch to Redis there too
  if you scale them beyond one instance)
- Request size limits (`express.json({ limit: ... })`, multer file-size cap)
- `express-validator` input validation on every mutating route
- Centralized error handler that never leaks stack traces in production
  (`NODE_ENV=production` strips internal error messages down to a generic one)
- Request IDs (`x-request-id`) on every request/response/log line for tracing across services
- Structured JSON logs via `pino` — compatible with Azure Log Stream / Application Insights ingestion

## Passwords & tokens

- Passwords hashed with `bcryptjs`, cost factor 12
- Access tokens: 15 minutes, RS256
- Refresh tokens: 7 days, RS256, **rotated on every use** — the old token is marked `revoked`
  in MongoDB the moment a new one is issued, so a replayed stolen refresh token fails
- `User.tokenVersion` lets you invalidate every outstanding refresh token for a user in one
  write (`POST /api/auth/logout-all`) — use this for "log out everywhere" / suspected compromise
- Cookies: `httpOnly`, `Secure`, `SameSite=None` (required for the Vercel↔Azure cross-site
  setup) — set `COOKIE_DOMAIN` if frontend and backend ever share a parent domain

## File uploads (ai-storage-service)

- MIME-type allow-list (`src/middleware/upload.js`) rejects unexpected file types before
  they reach Azure
- Size cap via `MAX_UPLOAD_BYTES` (default 25MB), enforced by multer before the buffer is fully read
- Filenames sanitized (`sanitizeFilename`) before being used in the blob path
- Blob names are namespaced by `ownerId/uuid.ext` — never trust the client's filename as a path
- Files are streamed on download (`stream.pipe(res)`), never buffered fully server-side

## Secrets

- Nothing in this repo's source ever contains a real secret — every credential is an
  environment variable, and `.env` is gitignored everywhere (`.env.example` is the only
  committed file)
- The JWT **private** key exists only in auth-service's environment. Committing it, or
  pasting it into the frontend's `.env.local`, defeats the entire "other services can't forge
  tokens" property described in `docs/architecture.md`
- `SUPABASE_SERVICE_ROLE_KEY` bypasses Supabase Row Level Security — it lives only in
  main-service, never in `NEXT_PUBLIC_*`

## Internal service-to-service trust

`INTERNAL_SERVICE_TOKEN` is attached by main-service's proxy as `x-internal-service-token`
when calling ai-storage-service. It's **not** the primary trust mechanism (ai-storage-service
re-verifies the caller's own JWT regardless) — treat it as an extra signal you can check in
`ai-storage-service` if you later add routes that should only ever be called by main-service,
never directly by the frontend.

## What's intentionally left to you

- Row Level Security policies on your Supabase tables (the service-role key bypasses RLS by
  design — enforce authorization in main-service's route handlers, as the sample `items`
  routes do with `.eq('owner_id', req.user.id)`)
- A WAF / Azure Front Door in front of the App Services if you need DDoS protection beyond
  App Service's own limits
- Centralizing rate-limit storage for auth-service/ai-storage-service if you scale them to
  multiple instances (currently in-memory, fine for a single instance / hackathon judging window)
