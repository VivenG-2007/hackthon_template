# Deployment

## Azure — the three backend services

Each of `services/auth-service`, `services/main-service`, `services/ai-storage-service` deploys
independently to its own **Azure App Service** (Linux, Node 18).

### 1. Create the App Services

```bash
az group create --name hackathon-rg --location eastus

for svc in auth main ai-storage; do
  az appservice plan create --name "plan-$svc" --resource-group hackathon-rg --sku B1 --is-linux
  az webapp create --name "your-$svc-service" --resource-group hackathon-rg \
    --plan "plan-$svc" --runtime "NODE:18-lts"
done
```

Recommended SKU:

- **B1/B2** for auth-service and ai-storage-service — bursty, not latency-critical
- **P0v3 / P1v3** (Premium v3) for main-service if you're pushing toward the ~3k req/s
  benchmark target in `docs/load-testing.md` — v3-series gives you a dedicated vCPU class
  and better autoscale headroom than the B-series burstable plans

### 2. Configure autoscaling (main-service)

```bash
az monitor autoscale create --resource-group hackathon-rg \
  --resource "your-main-service" --resource-type Microsoft.Web/sites \
  --name main-autoscale --min-count 2 --max-count 10 --count 2

az monitor autoscale rule create --resource-group hackathon-rg \
  --autoscale-name main-autoscale \
  --condition "CpuPercentage > 70 avg 5m" --scale out 2
```

Stateless design (no in-memory session state, Redis-backed rate limiting) means main-service
can scale horizontally without sticky sessions.

### 3. Environment variables

Set each service's `.env.example` keys via `az webapp config appsettings set` or the Portal's
Configuration blade — **never** commit `.env` files. Example:

```bash
az webapp config appsettings set --name your-auth-service --resource-group hackathon-rg \
  --settings JWT_PRIVATE_KEY_BASE64="$(cat private-key-base64.txt)" \
             MONGODB_URI="mongodb+srv://..."
```

### 4. GitHub Actions (included, path-filtered)

`.github/workflows/deploy-<service>.yml` deploys each service only when its own folder
changes, using Azure's OIDC federated login (no long-lived client secret in GitHub).

To set up the federated credential on your App Registration:

```bash
az ad app federated-credential create --id <app-registration-object-id> --parameters '{
  "name": "github-main-deploy",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:<org>/<repo>:ref:refs/heads/main",
  "audiences": ["api://AzureADTokenExchange"]
}'
```

**Known gotcha:** if GitHub appends a numeric suffix to your org/repo name during a rename
grace period, the OIDC `sub` claim GitHub sends won't match the subject you registered
(`AADSTS700213`). Check the exact repo name GitHub is currently using and re-create the
federated credential with that suffixed value if you hit this.

Add these repository secrets per service (`AUTH_SERVICE_...`, `MAIN_SERVICE_...`,
`AI_STORAGE_SERVICE_...`): `AZURE_CLIENT_ID`, `AZURE_APP_NAME`, plus shared
`AZURE_TENANT_ID` / `AZURE_SUBSCRIPTION_ID`.

### 5. Health checks & monitoring

- Point Azure's built-in Health Check (Portal → Monitoring → Health check) at `/health` for
  each App Service so unhealthy instances are cycled out automatically
- Enable Application Insights on each App Service for request timing, dependency tracking,
  and to visualize the `x-request-id` you'll see in the structured pino logs
- `/ready` reflects actual dependency state (Mongo/Redis connectivity) — use it for readiness
  gates, `/health` for liveness

### 6. Custom domains & HTTPS

App Service provisions a free managed certificate for custom domains
(`az webapp config ssl create --hostname ... `). Since the frontend (Vercel) and backends
(Azure) are different origins, cookies must be `SameSite=None; Secure` (already the default
in `services/auth-service/.env.example`) — this requires HTTPS on both sides, which Azure App
Service and Vercel both provide by default.

### 7. Deployment slots

For zero-downtime deploys, add a `staging` slot per App Service and swap after a smoke test:

```bash
az webapp deployment slot create --name your-main-service --resource-group hackathon-rg --slot staging
# deploy to slot, verify /health, then:
az webapp deployment slot swap --name your-main-service --resource-group hackathon-rg --slot staging
```

## Vercel — the frontend

1. Import the repo in Vercel, set the **root directory** to `frontend/`
2. Add environment variables (Project Settings → Environment Variables):
   - `NEXT_PUBLIC_AUTH_API_URL` = your deployed auth-service URL
   - `NEXT_PUBLIC_MAIN_API_URL` = your deployed main-service URL
   - `JWT_PUBLIC_KEY_BASE64`, `JWT_ISSUER`, `JWT_AUDIENCE` — server-only, used by `middleware.ts`
     for edge route protection (never prefixed `NEXT_PUBLIC_`, so it never reaches the browser
     bundle — safe to store since it's the *public* key)
3. Vercel auto-deploys on push to `main`; no extra workflow file needed
