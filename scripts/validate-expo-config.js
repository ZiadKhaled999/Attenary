const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function fail(msg) {
  console.error(`[fail] ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`[ok] ${msg}`);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`Missing ${file}`);
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    fail(`Invalid JSON ${file}: ${e.message}`);
  }
}

function run() {
  const pkg = readJson('package.json');
  const app = readJson('app.json');
  const expo = app.expo || {};

  if (!expo.version) fail('app.json.expo.version is missing');
  if (!expo.sdkVersion && !pkg.dependencies?.['expo']) fail('Expo SDK version missing');
  if (expo.android?.package && !/^([a-zA-Z][a-zA-Z0-9_]*\.)+[a-zA-Z][a-zA-Z0-9_]*$/.test(expo.android.package)) fail('Android package is invalid');
  if (!Array.isArray(expo.plugins)) fail('app.json.expo.plugins must be an array');
  if (!expo.extra?.eas?.projectId) fail('EAS projectId missing in app.json.expo.extra.eas.projectId');
  if (!['android', 'ios', 'web'].some((p) => typeof expo[p] === 'object')) fail('Missing platform config in app.json');

  if (!pkg.dependencies?.expo) fail('Expo dependency missing in package.json');
  if (!pkg.dependencies?.react) fail('React dependency missing in package.json');
  if (!pkg.dependencies?.['react-native']) fail('React Native dependency missing in package.json');

  ok('package.json has expo, react, react-native');
  ok('app.json has version, sdkVersion, package, plugins, projectId');
  ok('Platform config present');
}

run();
