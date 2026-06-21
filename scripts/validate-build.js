const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONFIG_PATH = path.join(__dirname, 'validate-build.config.json');

function run() {
  let failed = false;

  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(`Missing config: ${CONFIG_PATH}`);
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  if (!Array.isArray(config.checks) || config.checks.length === 0) {
    console.error('Invalid config: checks array is empty');
    process.exit(1);
  }

  for (const check of config.checks) {
    try {
      execSync(check.run, { stdio: 'pipe', encoding: 'utf8' });
      console.log(`[ok] ${check.name}`);
    } catch (error) {
      failed = true;
      console.error(`[fail] ${check.name}`);
      if (error.stdout) console.error(error.stdout.trim());
      if (error.stderr) console.error(error.stderr.trim());
    }
  }

  if (failed) {
    console.error('Build preflight failed');
    process.exit(1);
  }

  console.log('Build preflight passed');
}

run();
