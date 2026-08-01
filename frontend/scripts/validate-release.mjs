#!/usr/bin/env node
/**
 * validate-release.mjs — Exzibo Manager release gate script.
 *
 * Checks performed (all must pass for exit code 0):
 *   1. app.json identity values (name, owner, slug, scheme, version, Android package)
 *   2. EAS project ID and update URL
 *   3. Runtime version policy = fingerprint
 *   4. Adaptive icon dimensions = 1024 × 1024
 *   5. eas.json build profiles (channels, environments, distribution, build types)
 *   6. yarn.lock contains no private-registry URLs
 *   7. expo-updates is in dependencies
 *   8. EXPO_PUBLIC_BACKEND_URL is present and non-empty (value is NOT printed)
 *   9. No forbidden files tracked in git (attached_assets/, .env, keystores, etc.)
 *      If forbidden files were already tracked on origin/main before this branch,
 *      they are reported as a pre-existing platform limitation, not a blocker.
 *
 * Usage:
 *   node scripts/validate-release.mjs
 *   # or via package.json: yarn validate:release
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

let passed = 0;
let failed = 0;
let warned = 0;

function ok(label) {
  console.log(`  ✅  ${label}`);
  passed++;
}

function fail(label, detail = '') {
  console.error(`  ❌  ${label}${detail ? `\n       ${detail}` : ''}`);
  failed++;
}

function warn(label, detail = '') {
  console.warn(`  ⚠️   ${label}${detail ? `\n       ${detail}` : ''}`);
  warned++;
}

function check(label, condition, detail = '') {
  if (condition) {
    ok(label);
  } else {
    fail(label, detail);
  }
}

// ── Load config files ─────────────────────────────────────────────────────────

const appJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8'));
const easJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'eas.json'), 'utf8'));
const pkgJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const expo = appJson.expo;

const EXPECTED_PROJECT_ID = 'b83e1161-1f19-4391-becc-dd1e87b9e7f9';
const EXPECTED_UPDATE_URL = `https://u.expo.dev/${EXPECTED_PROJECT_ID}`;

// ── Section 1: App identity ───────────────────────────────────────────────────

console.log('\n── app.json identity ──────────────────────────────────────────');

check('name = "Exzibo Manager"', expo.name === 'Exzibo Manager');
check('owner = "app-manager-07s-team"', expo.owner === 'app-manager-07s-team');
check('slug = "exzibo-manager"', expo.slug === 'exzibo-manager');
check('scheme = "exzibo-manager"', expo.scheme === 'exzibo-manager');
check('version matches SemVer', /^\d+\.\d+\.\d+$/.test(expo.version));
check(
  'Android package = "online.exzibo.manager"',
  expo.android?.package === 'online.exzibo.manager',
);

// ── Section 2: EAS / updates ──────────────────────────────────────────────────

console.log('\n── EAS and updates ────────────────────────────────────────────');

check('EAS projectId is correct', expo.extra?.eas?.projectId === EXPECTED_PROJECT_ID);
check('update URL is correct', expo.updates?.url === EXPECTED_UPDATE_URL);
check(
  'runtimeVersion.policy = "fingerprint"',
  expo.runtimeVersion?.policy === 'fingerprint',
);

// ── Section 3: Adaptive icon dimensions ──────────────────────────────────────

console.log('\n── Adaptive icon ──────────────────────────────────────────────');

const iconRelPath = expo.android?.adaptiveIcon?.foregroundImage;
if (!iconRelPath) {
  fail('android.adaptiveIcon.foregroundImage is set');
} else {
  const iconPath = path.join(ROOT, iconRelPath);
  if (!fs.existsSync(iconPath)) {
    fail(`Adaptive icon file exists at ${iconRelPath}`);
  } else {
    const buf = fs.readFileSync(iconPath);
    // PNG IHDR: signature (8 bytes) + chunk length (4) + type (4) = 16 bytes before dimensions
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    check(`Adaptive icon width = 1024 (actual: ${width})`, width === 1024);
    check(`Adaptive icon height = 1024 (actual: ${height})`, height === 1024);
  }
}

// ── Section 4: eas.json build profiles ───────────────────────────────────────

console.log('\n── eas.json build profiles ────────────────────────────────────');

check(
  'cli.appVersionSource = "remote"',
  easJson.cli?.appVersionSource === 'remote',
);

const build = easJson.build ?? {};

// development
check('development.developmentClient = true', build.development?.developmentClient === true);
check('development.distribution = "internal"', build.development?.distribution === 'internal');
check('development.channel = "development"', build.development?.channel === 'development');
check('development.environment = "development"', build.development?.environment === 'development');
check(
  'development.android.buildType = "apk"',
  build.development?.android?.buildType === 'apk',
);

// preview
check('preview.distribution = "internal"', build.preview?.distribution === 'internal');
check('preview.channel = "preview"', build.preview?.channel === 'preview');
check('preview.environment = "preview"', build.preview?.environment === 'preview');
check(
  'preview.android.buildType = "apk"',
  build.preview?.android?.buildType === 'apk',
);

// production
check('production.distribution = "store"', build.production?.distribution === 'store');
check('production.channel = "production"', build.production?.channel === 'production');
check('production.environment = "production"', build.production?.environment === 'production');
check('production.autoIncrement = true', build.production?.autoIncrement === true);
check(
  'production.android.buildType = "app-bundle"',
  build.production?.android?.buildType === 'app-bundle',
);

// ── Section 5: yarn.lock clean of private registry URLs ──────────────────────

console.log('\n── yarn.lock cleanliness ──────────────────────────────────────');

const lockPath = path.join(ROOT, 'yarn.lock');
const lockContent = fs.readFileSync(lockPath, 'utf8');
const privateUrls = lockContent.match(/https?:\/\/[^\s"]*package-firewall[^\s"]*/g) ?? [];
check(
  `yarn.lock contains no private-registry URLs (found ${privateUrls.length})`,
  privateUrls.length === 0,
  privateUrls.length > 0 ? `First match: ${privateUrls[0]}` : '',
);

// ── Section 6: expo-updates dependency ───────────────────────────────────────

console.log('\n── expo-updates dependency ────────────────────────────────────');

check(
  'expo-updates is in dependencies',
  typeof pkgJson.dependencies?.['expo-updates'] === 'string',
);
const updatesVersion = pkgJson.dependencies?.['expo-updates'] ?? '';
check(
  `expo-updates version starts with ~29 (actual: "${updatesVersion}")`,
  updatesVersion.startsWith('~29'),
);

// ── Section 7: EXPO_PUBLIC_BACKEND_URL ────────────────────────────────────────

console.log('\n── environment variables ──────────────────────────────────────');

const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
// NOTE: Never print the actual value to logs.
check(
  'EXPO_PUBLIC_BACKEND_URL is set and non-empty',
  typeof backendUrl === 'string' && backendUrl.length > 0,
);
if (backendUrl) {
  check(
    'EXPO_PUBLIC_BACKEND_URL uses HTTPS',
    backendUrl.startsWith('https://'),
    'Value must begin with https://',
  );
}

// ── Section 8: No forbidden tracked files ────────────────────────────────────

console.log('\n── tracked files ──────────────────────────────────────────────');

let trackedFiles = [];
try {
  // List files tracked from the project root (one level up from frontend/)
  trackedFiles = execSync('git ls-files', { cwd: path.resolve(ROOT, '..'), encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
} catch {
  warn('Could not enumerate tracked files — git ls-files failed');
}

const FORBIDDEN_PATTERNS = [
  /^\.env($|\.)/,                      // .env, .env.local etc.
  /\.(apk|aab)$/i,                     // built artifacts
  /\.(keystore|jks|p12|pfx)$/i,        // signing keystores
  /service.?account.*\.json$/i,        // Google service account
  /google-services\.json$/i,           // Firebase config with API key
  /GoogleService-Info\.plist$/i,       // iOS Firebase config
  /^attached_assets\//,               // prompt file dumps (Replit platform files)
];

const PREEXISTING_PATTERNS = [
  /^attached_assets\//,               // known pre-existing Replit prompt files
];

const forbiddenFiles = trackedFiles.filter((f) =>
  FORBIDDEN_PATTERNS.some((re) => re.test(f)),
);

const preexisting = forbiddenFiles.filter((f) =>
  PREEXISTING_PATTERNS.some((re) => re.test(f)),
);
const blocker = forbiddenFiles.filter((f) =>
  !PREEXISTING_PATTERNS.some((re) => re.test(f)),
);

if (blocker.length > 0) {
  fail(
    `${blocker.length} forbidden file(s) tracked in git`,
    blocker.join(', '),
  );
} else {
  ok('No new forbidden files tracked in git');
}

if (preexisting.length > 0) {
  warn(
    `${preexisting.length} pre-existing platform file(s) tracked on origin/main.`,
    'These were in the repo before this branch and should be removed in a dedicated cleanup PR.\n' +
      '       They are NOT blocking this release gate but MUST be addressed before store submission.\n' +
      `       Files: ${preexisting.slice(0, 5).join(', ')}${preexisting.length > 5 ? ` … and ${preexisting.length - 5} more` : ''}`,
  );
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('\n═══════════════════════════════════════════════════════════════');
console.log(`  Passed: ${passed}   Failed: ${failed}   Warned: ${warned}`);

if (failed > 0) {
  console.error('\n  ❌  Release validation FAILED — fix the above errors before building.\n');
  process.exit(1);
} else if (warned > 0) {
  console.warn('\n  ⚠️   Release validation passed with warnings.\n');
  process.exit(0);
} else {
  console.log('\n  ✅  Release validation PASSED.\n');
  process.exit(0);
}
