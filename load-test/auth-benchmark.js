const autocannon = require('autocannon');

const target = process.env.TARGET_URL || 'http://localhost:5000';

autocannon(
  {
    url: `${target}/api/auth/login`,
    connections: 50,
    duration: 20,
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'loadtest@example.com', password: 'password123' }),
  },
  (err, result) => {
    if (err) { console.error(err); process.exit(1); }
    console.log(autocannon.printResult(result));
  }
);
