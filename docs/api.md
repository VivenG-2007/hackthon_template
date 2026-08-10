# API reference

Base URLs are whatever you set in each service's `.env` (`PORT`) — defaults below.

Every authenticated route accepts the token as **either** `Authorization: Bearer <token>` or
the `access_token` httpOnly cookie. The frontend uses cookies; use the Bearer form for curl/Postman.

## auth-service — `http://localhost:5000`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | public | `{ name, email, password }` → creates user, sets cookies, returns `{ user, accessToken }` |
| POST | `/api/auth/login` | public | `{ email, password }` → sets cookies, returns `{ user, accessToken }` |
| POST | `/api/auth/refresh` | refresh cookie | rotates the refresh token, returns a new access token |
| POST | `/api/auth/logout` | none required | revokes the current refresh token, clears cookies |
| POST | `/api/auth/logout-all` | access token | bumps `tokenVersion`, revokes every refresh token for the user |
| GET | `/api/auth/me` | access token | returns the current user |
| POST | `/api/auth/verify` | public | optional remote check: `{ token }` → `{ valid, payload }` (NOT on the main request path — every service verifies locally) |
| GET | `/api/auth/jwks` | public | returns the current public key + kid |
| GET | `/health` `/ready` `/metrics` | public | liveness / readiness / basic process metrics |

## main-service — `http://localhost:5001` (public: authenticated)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/items` | access token | list the caller's items (Supabase, cached in Redis 30s) |
| POST | `/api/items` | access token | `{ title, body? }` → create |
| DELETE | `/api/items/:id` | access token | delete (must be owned by caller) |
| ANY | `/api/proxy/*` | access token | forwards to ai-storage-service, e.g. `/api/proxy/api/ai/chat`, `/api/proxy/api/files/upload` |
| GET | `/health` `/ready` `/metrics` | public | `/ready` also reports Redis connectivity |

## ai-storage-service — `http://localhost:5002` (internal: reached via main-service's proxy, or directly for admin/internal tooling)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/ai/chat` | access token | `{ messages: [{role, content}], model?, conversationId? }` → persists to `Conversation` |
| POST | `/api/ai/generate` | access token | `{ prompt, model? }` → single-shot generation, no persistence |
| POST | `/api/ai/analyze` | access token | `{ input, instructions?, model? }` → wraps input with an instruction prefix |
| GET | `/api/files` | access token | list the caller's uploaded files |
| POST | `/api/files/upload` | access token | multipart `file` field → uploads to Azure Blob, returns `{ file }` |
| GET | `/api/files/:id` | access token | streams the file back (never buffered fully in memory) |
| DELETE | `/api/files/:id` | access token | deletes from Blob + MongoDB |
| GET | `/health` `/ready` `/metrics` | public | `/metrics` also reports the active `AI_PROVIDER` |

## Error shape (all services)

```json
{
  "error": {
    "message": "human-readable message",
    "code": "MACHINE_READABLE_CODE",
    "requestId": "uuid — also present as the x-request-id response header"
  }
}
```

## Admin-only

None of the sample routes are admin-gated out of the box. `main-service/src/middleware/auth.js`
exports `requireRole('admin')` — add it to any route where `req.user.role !== 'admin'` should
403 (the `role` claim comes straight from the JWT, set at registration in auth-service).
