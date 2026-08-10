# Load testing

## Local benchmark vs Azure production benchmark

These are two different numbers and this doc keeps them separate on purpose:

- **Local benchmark** (`npm run loadtest:*` against `localhost`): measures a single Node
  process on your laptop, no real network hop, no Azure App Service CPU throttling, no
  Azure-managed Redis/Mongo latency. Good for catching regressions between commits. Not
  predictive of production capacity.
- **Azure production benchmark** (`TARGET_URL=https://... npm run loadtest:*`): measures the
  actual deployed App Service plan, real network latency between Azure regions/services, and
  whatever Supabase/MongoDB Atlas/Redis tier you're actually paying for. This is the number
  that matters for capacity planning.

**Do not treat "~3,000 requests/sec on a v3 CPU plan" as a guarantee.** It's a target to
benchmark toward on a lightweight endpoint (`/health`, or a cached `GET`), not a promise for
every endpoint — an endpoint doing a Supabase write + Redis invalidation + AI proxy call will
be far slower than a cached read, regardless of plan size. Benchmark your actual hot path.

## Running the included scripts

```bash
# local
npm run loadtest:main
npm run loadtest:auth
npm run loadtest:ai      # needs ACCESS_TOKEN set to a real token
npm run loadtest:mixed

# against Azure
TARGET_URL=https://your-main-service.azurewebsites.net npm run loadtest:main
```

Each autocannon run reports:

- requests/sec (mean, and the distribution)
- latency: p50 / p95 / p99 (and mean/max)
- errors/sec and total error count
- total requests completed, total bytes transferred

An equivalent `k6` script (`load-test/k6-benchmark.js`) is included for teams that want staged
ramp-up (`stages` in the script) or plan to run distributed load generation later:

```bash
k6 run load-test/k6-benchmark.js -e TARGET_URL=https://your-main-service.azurewebsites.net
```

## What to change per endpoint you benchmark

- `main-benchmark.js` hits `/health` by default (isolates raw HTTP throughput). Change the
  `url` to `/api/items` and add a valid `Authorization: Bearer <token>` header to measure
  authenticated, DB-backed throughput instead — that's the number closer to real usage.
- `ai-benchmark.js` and `files-benchmark.js` need `ACCESS_TOKEN` set — get one from
  `POST /api/auth/login` against your running auth-service.
- Keep AI-endpoint concurrency low (the script defaults to 10 connections) — you're bound by
  the upstream AI provider's latency, not by main-service/ai-storage-service themselves.

## Watching Azure while you benchmark

In the Portal, on each App Service: **Monitoring → Metrics**, and add:

- CPU Percentage
- Memory Percentage
- Http Queue Length
- Requests (split by 2xx/4xx/5xx)
- Average Response Time
- Data In / Data Out

Watch **Http Queue Length** in particular — a queue that grows while CPU is still under 100%
usually means you're I/O bound (waiting on Mongo/Supabase/Redis), not CPU bound, so scaling to
a bigger plan won't help as much as scaling the database tier or adding more instances.

If you enabled the autoscale rule from `docs/deployment.md`, watch the **instance count**
metric climb during the benchmark — that's the horizontal scaling actually kicking in.
