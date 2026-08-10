const autocannon = require('autocannon');

const target = process.env.TARGET_URL || 'http://localhost:5001';
// Uses /health (no auth, no DB round trip) to isolate raw HTTP throughput of
// main-service on its App Service plan. Swap the url to /api/items with a
// valid ACCESS_TOKEN cookie/header once you want an end-to-end, DB-inclusive number.
autocannon(
  {
    url: `${target}/health`,
    connections: 100,
    duration: 30,
    pipelining: 1,
  },
  (err, result) => {
    if (err) { console.error(err); process.exit(1); }
    console.log(autocannon.printResult(result));
    console.log('\nNote: this measures raw HTTP throughput, not authenticated/DB-backed request throughput.');
    console.log('For a realistic ~3k rps figure, benchmark your actual hot endpoint with a valid token.');
  }
);
