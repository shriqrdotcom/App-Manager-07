/**
 * Jest global setup — runs before each test file, before any module is imported.
 * Sets the minimum env vars needed to prevent config.ts from throwing at load time.
 */
process.env.EXPO_PUBLIC_BACKEND_URL = 'https://dashboard.exzibo.online';
// Ensure preview-demo mode is off unless a specific test overrides it.
delete process.env.EXPO_PUBLIC_PREVIEW_DEMO;
