const autocannon = require('autocannon');

const target = process.env.TARGET_URL || 'http://localhost:5002';
const token = process.env.ACCESS_TOKEN || '';

autocannon(
  {
    url: `${target}/api/files`,
    connections: 30,
    duration: 20,
    method: 'GET',
    headers: { authorization: `Bearer ${token}` },
  },
  (err, result) => {
    if (err) { console.error(err); process.exit(1); }
    console.log(autocannon.printResult(result));
  }
);
