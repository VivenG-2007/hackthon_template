# Load testing

Scripts here use [autocannon](https://github.com/mcollina/autocannon) to benchmark each
service locally or against a deployed Azure environment. Run any script with:

```bash
node load-test/main-benchmark.js
```

Set `TARGET_URL` to point at a deployed environment instead of localhost:

```bash
TARGET_URL=https://main-<yourapp>.azurewebsites.net node load-test/main-benchmark.js
```

**Local benchmark vs Azure production benchmark are not the same number.** A local run
measures your laptop's network stack and a single Node process with no real network hop —
useful for catching regressions, not for capacity planning. Only a run against the actual
deployed App Service plan tells you what it can really hold; see `docs/load-testing.md`
for how to read Azure's own CPU/memory/HTTP metrics alongside these numbers, and treat any
"~3k requests/sec" figure as a target to benchmark against on your specific plan and
endpoint mix, not a guarantee.

An equivalent k6 script (`k6-benchmark.js`) is included for teams that prefer k6's scripting
model or want distributed load generation.
