import http from 'k6/http';
import { check, sleep } from 'k6';

// Run with: k6 run load-test/k6-benchmark.js -e TARGET_URL=https://main-<yourapp>.azurewebsites.net
const target = __ENV.TARGET_URL || 'http://localhost:5001';

export const options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const res = http.get(`${target}/health`);
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(0.1);
}
