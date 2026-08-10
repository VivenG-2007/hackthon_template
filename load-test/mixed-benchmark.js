// Mixed workload: fires the health, items, and AI benchmarks back to back and
// prints a combined summary — a rough approximation of real traffic shape
// (mostly cheap reads, some writes, occasional AI calls).
const { execSync } = require('child_process');

const scripts = ['main-benchmark.js', 'auth-benchmark.js', 'ai-benchmark.js'];
for (const script of scripts) {
  console.log(`\n=== Running ${script} ===`);
  try {
    execSync(`node ${__dirname}/${script}`, { stdio: 'inherit' });
  } catch (err) {
    console.error(`${script} failed:`, err.message);
  }
}
