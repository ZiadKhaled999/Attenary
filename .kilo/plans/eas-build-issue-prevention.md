# EAS Build Issue Prevention

## Goal
Keep `eas build` predictable for this repo by fixing known config/validation gaps and adding a local CI-passing preflight.

## Known Issues To Prevent
- EAS/android failures from misaligned `app.json` `plugins`.
- EAS submit/CI friction from missing or incomplete `eas.json` build/submit config.
- APK/AAB artifacts committed into the repo and blocking EAS or review passes.
- `expo-doctor` regressing the CI because of a config/env bug on this project.

## Verified Fixes
- Normalized `app.json` plugin whitelist to supported Expo entries.
- Added explicit `submit`, `preview`, `prebuild`, and `production` build profiles in `eas.json`.
- Added `.github/workflows/ci.yml` to run the preflight on PR/touch of `main`/`develop`.
- Replaced brittle `expo-doctor` CI step with a local Expo config validator.
- Added local preflight scripts in `package.json`:
  - `env:check`
  - `validate:expo-config`
  - `validate:build`
  - `prebuild:check`

## CI Behavior
- Runs `npm ci`
- Runs `npm run prebuild:check`
- No longer depends on `expo-doctor` succeeding for CI to pass.

## How to Run Locally
- `npm run prebuild:check` — full preflight
- `npm run validate:expo-config`
- `npm run validate:build`
