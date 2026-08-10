# Hackathon Platform Template

A production-oriented starter for hackathons: **1 Next.js frontend + 3 independent backend
services**, wired together with JWT auth, Redis, Supabase, MongoDB, and Azure Blob Storage —
so your team spends the weekend on your idea, not on infrastructure plumbing.

```
Vercel (frontend) → main-service (Azure, Supabase+Redis) → ai-storage-service (Azure, Mongo+Redis+Blob)
                                                    ↑
                                           auth-service (Azure, Mongo) — issues JWTs
```

Full diagram: [`docs/architecture.md`](docs/architecture.md) · mermaid source: [`infrastructure/diagrams/architecture.mmd`](infrastructure/diagrams/architecture.mmd)

## 1. Overview

| Piece | Tech | Role |
|---|---|---|
| `frontend/` | Next.js 14, TypeScript, Tailwind | Login/register, dashboard, AI + file upload demo, deploys to Vercel |
| `services/auth-service` | Node/Express, MongoDB | Registers/logs in users, signs RS256 JWTs, owns the private key |
| `services/main-service` | Node/Express, Supabase, Redis | Your main product API, gateway to ai-storage-service |
| `services/ai-storage-service` | Node/Express, MongoDB, Redis, Azure Blob | Pluggable AI provider + file storage |

**The core idea:** auth-service signs tokens with a private key; main-service and
ai-storage-service each hold only the matching *public* key and verify every request's JWT
signature locally — no network call back to auth-service on the hot path. See
[`docs/architecture.md`](docs/architecture.md) for why.

## 2. Folder structure

```
hackathon-platform/
├── frontend/                  # Next.js app (Vercel)
├── services/
│   ├── auth-service/          # Azure App Service
│   ├── main-service/          # Azure App Service
│   └── ai-storage-service/    # Azure App Service
├── infrastructure/diagrams/   # architecture.mmd (mermaid)
├── load-test/                 # autocannon + k6 scripts
├── docs/                      # architecture, deployment, security, load-testing, api
├── .github/workflows/         # per-service, path-filtered Azure deploys
├── docker-compose.yml
├── package.json                # root dev/build/test/loadtest scripts
└── README.md
```

Each service under `services/` is intentionally self-contained (own `package.json`,
`Dockerfile`, `.env.example`) — that's what makes it a *template*: copy one folder into a
different hackathon repo and it still works.

## 3. Local setup

**Prereqs:** Node 18+, and either Docker, or local MongoDB + Redis.

```bash
git clone <this-repo> && cd hackathon-platform
npm run install:all          # installs all 4 workspaces
npm run generate-keys        # prints a fresh RS256 keypair
```

Paste the printed `JWT_PRIVATE_KEY_BASE64` into `services/auth-service/.env`, and the printed
`JWT_PUBLIC_KEY_BASE64` into **both** `services/main-service/.env` and
`services/ai-storage-service/.env` (and, optionally, `frontend/.env.local` if you want the
edge middleware's fast-redirect to work locally too).

Fill in the rest of each service's `.env` (copied from `.env.example` already) — at minimum:
`MONGODB_URI` (auth-service and ai-storage-service), `SUPABASE_URL` /
`SUPABASE_SERVICE_ROLE_KEY` (main-service), `AZURE_STORAGE_CONNECTION_STRING`
(ai-storage-service). Everything else has a sane local default.

### With Docker

```bash
npm run docker:up
```

Starts Redis, MongoDB, all three backends, and the frontend. Supabase and Azure Blob are
external managed services — configure them via `.env` even for local dev (see
`docs/deployment.md` if you don't have either yet; both have generous free tiers).

### Without Docker

```bash
npm run dev
```

Runs all four services concurrently with `nodemon`/`next dev`, color-coded output. Requires
MongoDB and Redis running locally (or point `MONGODB_URI`/`REDIS_URL` at hosted instances).

Frontend: http://localhost:3000 · auth-service: :5000 · main-service: :5001 · ai-storage: :5002

## 4. Environment variables

Every service has its own `.env.example` — see the top of each file for which variables
belong to which service. Full explanation of every variable's purpose:
[`docs/security.md`](docs/security.md) and [`docs/architecture.md`](docs/architecture.md).

**Never put a service-role key, database URI, Redis password, Azure storage key, or the JWT
*private* key in `frontend/.env.local`.** Only `NEXT_PUBLIC_*` variables reach the browser;
`JWT_PUBLIC_KEY_BASE64` is the one non-`NEXT_PUBLIC_` frontend variable and it's safe because
it's a *public* key, used only server-side by `middleware.ts`.

## 5. Authentication flow

1. `POST /api/auth/register` or `/login` on auth-service → sets `access_token` (15m) and
   `refresh_token` (7d) as httpOnly, Secure, SameSite=None cookies, and also returns the
   access token in the JSON body for Bearer-style clients.
2. Every request to main-service / ai-storage-service carries the cookie (browser) or
   `Authorization: Bearer <token>` (non-browser clients) — both are checked by every service.
3. Each service verifies the JWT signature **locally** with the shared public key. No call to
   auth-service happens per-request.
4. On a 401, the frontend calls `/api/auth/refresh` once (rotates the refresh token) and
   retries the original request (`frontend/lib/api.ts`).
5. `POST /api/auth/logout` revokes just that refresh token; `POST /api/auth/logout-all`
   invalidates every session for the user.

Full details: [`docs/architecture.md`](docs/architecture.md), [`docs/security.md`](docs/security.md).

## 6. API documentation

[`docs/api.md`](docs/api.md) — every route, its auth requirement, and its request/response shape.

## 7. Azure deployment

[`docs/deployment.md`](docs/deployment.md) — App Service creation, recommended SKUs
(Premium v3 for main-service if you're chasing the throughput target below), autoscaling,
environment variable setup, the included GitHub Actions OIDC workflows, health checks,
Application Insights, custom domains/HTTPS, and deployment slots.

## 8. Vercel deployment

Also in [`docs/deployment.md`](docs/deployment.md#vercel--the-frontend) — set root directory
to `frontend/`, add the three frontend env vars, push to `main`.

## 9. Scaling strategy

main-service is built stateless (no in-memory sessions, Redis-backed rate limiting) so it
scales horizontally behind Azure's autoscale rules without sticky sessions. Target: **on a
Premium v3 App Service plan, main-service aims for roughly 3,000 requests/sec on a lightweight
endpoint** — this is a benchmark target, not a guarantee; actual throughput depends on your
endpoint's DB/AI calls, payload size, and plan tier. Benchmark your real traffic shape with
the included scripts before trusting any number. See [`docs/load-testing.md`](docs/load-testing.md).

## 10. Load testing

```bash
npm run loadtest:main    # or :auth, :ai, :mixed
TARGET_URL=https://your-main-service.azurewebsites.net npm run loadtest:main
```

Local vs. Azure-production benchmarks measure different things — see
[`docs/load-testing.md`](docs/load-testing.md) for how to read them and what Azure metrics
to watch alongside.

## 11. Security

Helmet, CORS allow-lists, Redis-backed rate limiting, input validation, RS256 JWTs with
rotating refresh tokens, httpOnly/Secure/SameSite cookies, bcrypt password hashing, MIME +
size-limited file uploads, centralized error handling with no leaked stack traces in
production, structured request-ID-tagged logging. Full writeup:
[`docs/security.md`](docs/security.md).

## 12. Making this your hackathon project

You should mostly be editing:

- `services/main-service/src/{controllers,routes}/itemsController.js` → your actual domain model
- `services/ai-storage-service/src/controllers/aiController.js` → your actual AI use case
- `services/ai-storage-service/src/services/aiProviders/` → swap or add an AI provider
- `frontend/app/` → your actual UI
- Supabase schema / MongoDB collections → your actual data

You should rarely need to touch: JWT signing/verification, rate limiting, CORS, cookie
handling, Docker/Azure/Vercel config, or the health/ready/metrics endpoints — that's the part
this template exists to hand you already wired.

## 13. Troubleshooting

| Symptom | Likely cause |
|---|---|
| 401 on every request even right after login | `JWT_PUBLIC_KEY_BASE64` on main-service/ai-storage-service doesn't match auth-service's private key — re-run `npm run generate-keys` and copy both values everywhere |
| Cookies never get set in the browser | Cross-site cookies need `Secure` + `SameSite=None`, which needs HTTPS — won't fully work over plain `http://localhost` in every browser; test against deployed HTTPS URLs, or use the `Authorization: Bearer` flow locally |
| `AADSTS700213` during Azure/GitHub OIDC deploy | GitHub added a numeric suffix to your org/repo during a rename grace period — recreate the federated credential with the exact suffixed subject (see `docs/deployment.md`) |
| `/api/items` returns 503 `SUPABASE_UNAVAILABLE` | `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` not set on main-service |
| File upload returns 503 | `AZURE_STORAGE_CONNECTION_STRING` not set on ai-storage-service |
| AI chat returns the "[mock provider]" message | `AI_PROVIDER` is still `mock` (the default, so the template runs with zero API keys) — set `AI_PROVIDER` + `AI_API_KEY` in ai-storage-service's `.env` |

---

Built as a universal starting point — auth, JWT verification, Redis, Supabase, MongoDB,
Azure Blob, AI integration, logging, rate limiting, Docker, Azure deployment, Vercel
deployment, and load testing are already wired. Bring the idea.
"# hackthon_template" 
