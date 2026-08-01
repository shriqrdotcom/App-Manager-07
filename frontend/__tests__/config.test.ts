/**
 * Tests for src/config/index.ts
 *
 * Covers:
 * - Backend URL is read from EXPO_PUBLIC_BACKEND_URL
 * - Trailing slashes are stripped from backendUrl
 * - Missing URL throws unless EXPO_PUBLIC_PREVIEW_DEMO is 'true'
 * - Preview demo mode sets an empty backendUrl without throwing
 *
 * Uses jest.isolateModules() so each test gets a freshly-evaluated module
 * without cross-contaminating the global module registry.
 */

describe('config — backendUrl', () => {
  const originalBackend = process.env.EXPO_PUBLIC_BACKEND_URL;
  const originalDemo = process.env.EXPO_PUBLIC_PREVIEW_DEMO;

  afterEach(() => {
    // Restore the original env state between tests.
    if (originalBackend !== undefined) {
      process.env.EXPO_PUBLIC_BACKEND_URL = originalBackend;
    } else {
      delete process.env.EXPO_PUBLIC_BACKEND_URL;
    }
    if (originalDemo !== undefined) {
      process.env.EXPO_PUBLIC_PREVIEW_DEMO = originalDemo;
    } else {
      delete process.env.EXPO_PUBLIC_PREVIEW_DEMO;
    }
  });

  function loadConfig(): { backendUrl: string } {
    let cfg!: { backendUrl: string };
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      cfg = (require('@/src/config') as { config: { backendUrl: string } }).config;
    });
    return cfg;
  }

  function expectLoadToThrow(msg: string): void {
    expect(() => {
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('@/src/config');
      });
    }).toThrow(msg);
  }

  it('returns backendUrl without trailing slash', () => {
    process.env.EXPO_PUBLIC_BACKEND_URL = 'https://dashboard.exzibo.online';
    expect(loadConfig().backendUrl).toBe('https://dashboard.exzibo.online');
  });

  it('strips a single trailing slash', () => {
    process.env.EXPO_PUBLIC_BACKEND_URL = 'https://dashboard.exzibo.online/';
    expect(loadConfig().backendUrl).toBe('https://dashboard.exzibo.online');
  });

  it('strips multiple trailing slashes', () => {
    process.env.EXPO_PUBLIC_BACKEND_URL = 'https://dashboard.exzibo.online///';
    expect(loadConfig().backendUrl).toBe('https://dashboard.exzibo.online');
  });

  it('throws when EXPO_PUBLIC_BACKEND_URL is missing and preview demo mode is off', () => {
    delete process.env.EXPO_PUBLIC_BACKEND_URL;
    delete process.env.EXPO_PUBLIC_PREVIEW_DEMO;
    expectLoadToThrow('[Config] EXPO_PUBLIC_BACKEND_URL is required but not set.');
  });

  it('does not throw in preview demo mode when URL is missing', () => {
    delete process.env.EXPO_PUBLIC_BACKEND_URL;
    process.env.EXPO_PUBLIC_PREVIEW_DEMO = 'true';
    expect(() => loadConfig()).not.toThrow();
  });

  it('sets backendUrl to empty string in preview demo mode without URL', () => {
    delete process.env.EXPO_PUBLIC_BACKEND_URL;
    process.env.EXPO_PUBLIC_PREVIEW_DEMO = 'true';
    expect(loadConfig().backendUrl).toBe('');
  });

  it('does not throw when both URL and preview demo are set', () => {
    process.env.EXPO_PUBLIC_BACKEND_URL = 'https://dashboard.exzibo.online';
    process.env.EXPO_PUBLIC_PREVIEW_DEMO = 'true';
    expect(() => loadConfig()).not.toThrow();
  });
});
