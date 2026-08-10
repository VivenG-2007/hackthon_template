# Architecture

```
                         ┌───────────────────────┐
                         │        Vercel          │
                         │   frontend (Next.js)   │
                         └───────────┬─────────────┘
                                     │ HTTPS, credentials: include
                                     ▼
                    ┌────────────────────────────────────┐
                    │        main-service (Azure)         │
                    │  Supabase · Redis · rate limiting   │
                    │  verifies JWT locally (RS256)       │
                    └───────┬───────────────────┬─────────┘
                            │                    │
                 JWT verified locally  ┌─────────┘  JWT verified locally
                            │          │            (proxy /api/proxy/*)
                            ▼          ▼
        ┌─────────────────────┐   ┌───────────────────────────┐
        │   auth-service        │   │  ai-storage-service        │
        │   (Azure)              │   │  (Azure)                    │
        │   MongoDB (users)      │   │  MongoDB · Redis · Azure Blob│
        │   owns JWT PRIVATE key │   │  AI provider abstraction    │
        └─────────────────────┘   └───────────────────────────┘
```

## Why three independent backends

- **auth-service** is the only service that ever touches the JWT **private** key. It signs
  access tokens (short-lived, 15m default) and refresh tokens (7d default, rotated on every
  use, individually revocable via a MongoDB `RefreshToken` collection).
- **main-service** and **ai-storage-service** each hold only the **public** key and verify
  every request's JWT signature locally with `jsonwebtoken` (`RS256`). Neither ever calls
  auth-service to check a token. This means:
  - The system keeps working for already-logged-in users even if auth-service is briefly down.
  - Verification is a cheap local CPU operation, not a network hop — important for the
    main-service throughput target (see `docs/load-testing.md`).
- **ai-storage-service** is deliberately generic: a pluggable AI provider layer
  (`services/ai-storage-service/src/services/aiProviders/`) plus Azure Blob + MongoDB +
  Redis. Swap the AI use case per hackathon without touching auth or the main API.

## Request flow

1. Browser sends credentials to **auth-service** (`/api/auth/login`), receives `access_token`
   and `refresh_token` as httpOnly cookies (SameSite=None; Secure — required because the
   frontend origin on Vercel and the backend origin on Azure are different hosts).
2. Browser calls **main-service** directly for product APIs (`/api/items`). main-service
   verifies the cookie/Bearer token itself.
3. For AI or file operations, the browser calls **main-service**'s `/api/proxy/*`, which
   forwards the same token to **ai-storage-service**. ai-storage-service verifies the token
   again independently — main-service is a convenience gateway, not a trust boundary.
4. On a 401, the frontend's axios interceptor calls `/api/auth/refresh` once and replays the
   original request (see `frontend/lib/api.ts`).

## Key rotation

`JWT_KID` is embedded in every signed token's header. To rotate keys: generate a new keypair,
deploy the new public key to main-service/ai-storage-service *before* auth-service starts
signing with it, then cut auth-service over. For real zero-downtime rotation, extend
`GET /api/auth/jwks` (currently returns a single key) into a small map of `kid -> public key`
and have each service's verify step pick the right key by the token's `kid` header.

## Symmetric vs asymmetric JWTs

This template defaults to **RS256 (asymmetric)**: the tradeoff is a slightly heavier token
and key-management step (`npm run generate-keys`) in exchange for auth-service being the only
service that can *issue* tokens, while every other service can only *verify* them. If your
hackathon timeline can't afford the extra setup step, switching to `HS256` with one shared
`JWT_SECRET` across all three services is a same-shape change (swap `verifyToken`/`signAccessToken`
in each service's JWT util) — just be aware every service that holds the secret can also forge
tokens.
