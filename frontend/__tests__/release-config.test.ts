/**
 * Tests for the release configuration values baked into app.json, eas.json, and package.json.
 *
 * These tests guard against accidental identity changes during development.
 * They do NOT test runtime behavior — they validate the static configuration files.
 *
 * Covers:
 * - App identity (name, owner, slug, scheme, version, Android package)
 * - EAS project ID and update URL
 * - Runtime version policy
 * - expo-updates is installed
 * - EAS build profiles (APK/AAB, channels, environments, distribution)
 * - Production profile uses remote versioning and autoIncrement
 */

import path from 'path';
import fs from 'fs';

const ROOT = path.resolve(__dirname, '..');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const app = require(path.join(ROOT, 'app.json')) as {
  expo: {
    name: string;
    owner: string;
    slug: string;
    scheme: string;
    version: string;
    android: { package: string; adaptiveIcon: { foregroundImage: string; backgroundColor: string } };
    ios: { bundleIdentifier: string };
    extra: { eas: { projectId: string } };
    updates: { url: string };
    runtimeVersion: { policy: string };
  };
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const eas = require(path.join(ROOT, 'eas.json')) as {
  cli: { appVersionSource: string };
  build: Record<string, {
    node?: string;
    developmentClient?: boolean;
    distribution: string;
    channel?: string;
    environment?: string;
    autoIncrement?: boolean;
    android?: { buildType: string };
  }>;
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pkg = require(path.join(ROOT, 'package.json')) as {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  engines: { node: string };
  packageManager: string;
};

const EXPECTED_PROJECT_ID = 'b83e1161-1f19-4391-becc-dd1e87b9e7f9';
const EXPECTED_UPDATE_URL = `https://u.expo.dev/${EXPECTED_PROJECT_ID}`;

// ---- app identity ----

describe('app.json — identity', () => {
  it('name is "Exzibo Manager"', () => {
    expect(app.expo.name).toBe('Exzibo Manager');
  });

  it('owner is "app-manager-07s-team"', () => {
    expect(app.expo.owner).toBe('app-manager-07s-team');
  });

  it('slug is "exzibo-manager"', () => {
    expect(app.expo.slug).toBe('exzibo-manager');
  });

  it('scheme is "exzibo-manager"', () => {
    expect(app.expo.scheme).toBe('exzibo-manager');
  });

  it('version is valid SemVer', () => {
    expect(app.expo.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('version is "1.0.0"', () => {
    expect(app.expo.version).toBe('1.0.0');
  });

  it('Android package is "online.exzibo.manager"', () => {
    expect(app.expo.android.package).toBe('online.exzibo.manager');
  });
});

// ---- EAS / updates ----

describe('app.json — EAS and updates', () => {
  it('EAS project ID is correct', () => {
    expect(app.expo.extra.eas.projectId).toBe(EXPECTED_PROJECT_ID);
  });

  it('update URL contains the verified project ID', () => {
    expect(app.expo.updates.url).toBe(EXPECTED_UPDATE_URL);
  });

  it('runtime version policy is "fingerprint"', () => {
    expect(app.expo.runtimeVersion.policy).toBe('fingerprint');
  });
});

// ---- adaptive icon ----

describe('app.json — adaptive icon', () => {
  it('foreground image file exists', () => {
    const iconPath = path.join(ROOT, app.expo.android.adaptiveIcon.foregroundImage);
    expect(fs.existsSync(iconPath)).toBe(true);
  });

  it('adaptive icon is exactly 1024×1024', () => {
    const iconPath = path.join(ROOT, app.expo.android.adaptiveIcon.foregroundImage);
    const buf = fs.readFileSync(iconPath);
    // PNG dimensions are stored as big-endian uint32 at byte offsets 16 and 20
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    expect(width).toBe(1024);
    expect(height).toBe(1024);
  });
});

// ---- expo-updates dependency ----

describe('package.json — expo-updates', () => {
  it('expo-updates is a direct dependency', () => {
    expect(pkg.dependencies['expo-updates']).toBeDefined();
  });

  it('expo-updates version range starts with ~29', () => {
    expect(pkg.dependencies['expo-updates']).toMatch(/^~29\./);
  });
});

// ---- EAS build profiles ----

describe('eas.json — build profiles', () => {
  it.each(['development', 'preview', 'production'])(
    '%s profile uses Node 22.23.1',
    (profile) => {
      expect(eas.build[profile].node).toBe('22.23.1');
    },
  );

  it('development profile has developmentClient=true', () => {
    expect(eas.build.development.developmentClient).toBe(true);
  });

  it('development profile uses internal distribution', () => {
    expect(eas.build.development.distribution).toBe('internal');
  });

  it('development profile builds APK', () => {
    expect(eas.build.development.android?.buildType).toBe('apk');
  });

  it('development profile has channel "development"', () => {
    expect(eas.build.development.channel).toBe('development');
  });

  it('development profile has environment "development"', () => {
    expect(eas.build.development.environment).toBe('development');
  });

  it('preview profile uses internal distribution', () => {
    expect(eas.build.preview.distribution).toBe('internal');
  });

  it('preview profile builds APK', () => {
    expect(eas.build.preview.android?.buildType).toBe('apk');
  });

  it('preview profile has channel "preview"', () => {
    expect(eas.build.preview.channel).toBe('preview');
  });

  it('preview profile has environment "preview"', () => {
    expect(eas.build.preview.environment).toBe('preview');
  });

  it('production profile uses store distribution', () => {
    expect(eas.build.production.distribution).toBe('store');
  });

  it('production profile builds app-bundle (AAB)', () => {
    expect(eas.build.production.android?.buildType).toBe('app-bundle');
  });

  it('production profile has channel "production"', () => {
    expect(eas.build.production.channel).toBe('production');
  });

  it('production profile has environment "production"', () => {
    expect(eas.build.production.environment).toBe('production');
  });

  it('production profile uses autoIncrement', () => {
    expect(eas.build.production.autoIncrement).toBe(true);
  });

  it('production profile uses remote version source via cli.appVersionSource', () => {
    expect(eas.cli.appVersionSource).toBe('remote');
  });
});

// ---- runtime versions ----

describe('package.json and CI — runtime versions', () => {
  it('supports Node 22 and Node 24', () => {
    expect(pkg.engines.node).toBe('>=22.0.0 <23 || >=24.0.0 <25');
  });

  it('keeps Yarn at 1.22.22', () => {
    expect(pkg.packageManager).toMatch(/^yarn@1\.22\.22/);
  });

  it('GitHub Actions uses Node 22.23.1', () => {
    const workflow = fs.readFileSync(
      path.resolve(ROOT, '..', '.github', 'workflows', 'mobile-ci.yml'),
      'utf8',
    );
    expect(workflow).toMatch(/node-version:\s*['"]22\.23\.1['"]/);
  });
});
