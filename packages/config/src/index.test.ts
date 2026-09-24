import { describe, expect, it } from 'vitest';

import {
  buildConfigDefine,
  CONFIG_KEYS,
  getConfig,
  getConfigFlag,
  getConfigValue,
  isPluginEnabled,
  isWhitelabelEnabled,
  type ConfigKey,
} from '@irene/config';

/** Set the values a build would have frozen in. */
const atBuild = (values: Record<string, string>) => {
  globalThis.__BUILD_CONFIG__ = values;
};

/** Set the tier-1 values a server would have injected. */
const injected = (values: Record<string, string>) => {
  window.runtimeGlobalConfig = values;
};

describe('tier resolution', () => {
  it('falls back to the default when neither tier carries the key', () => {
    expect(getConfig('IRENE_API_HOST')).toBe('https://api.appknox.com');
    expect(getConfig('WHITELABEL_THEME')).toBe('dark');
    expect(getConfig('ENTERPRISE')).toBe(false);
  });

  it('prefers a build value over the default', () => {
    atBuild({ IRENE_API_HOST: 'https://build.test' });

    expect(getConfig('IRENE_API_HOST')).toBe('https://build.test');
  });

  it('prefers an injected value over a build one', () => {
    atBuild({ IRENE_API_HOST: 'https://build.test' });
    injected({ IRENE_API_HOST: 'https://injected.test' });

    expect(getConfig('IRENE_API_HOST')).toBe('https://injected.test');
  });

  it('uses an injected value even when it is an empty string', () => {
    atBuild({ WHITELABEL_NAME: 'Build' });
    injected({ WHITELABEL_NAME: '' });

    expect(getConfig('WHITELABEL_NAME')).toBe('');
  });

  it('reads the injected config on every call, not once at import', () => {
    expect(getConfig('WHITELABEL_NAME')).toBe('');

    injected({ WHITELABEL_NAME: 'Set after the module loaded' });

    expect(getConfig('WHITELABEL_NAME')).toBe('Set after the module loaded');
  });
});

describe('IRENE_API_HOST normalisation', () => {
  it("turns '/' into an empty string from the injected tier", () => {
    injected({ IRENE_API_HOST: '/' });

    expect(getConfig('IRENE_API_HOST')).toBe('');
  });

  it("turns '/' into an empty string from the build tier", () => {
    atBuild({ IRENE_API_HOST: '/' });

    expect(getConfig('IRENE_API_HOST')).toBe('');
  });

  it('leaves any other host unchanged', () => {
    atBuild({ IRENE_API_HOST: 'https://api.appknox.com/' });

    expect(getConfig('IRENE_API_HOST')).toBe('https://api.appknox.com/');
  });

  it('normalises IRENE_API_HOST and no other key', () => {
    atBuild({ WHITELABEL_LOGO: '/' });

    expect(getConfig('WHITELABEL_LOGO')).toBe('/');
  });
});

describe('WHITELABEL_FAVICON has no default', () => {
  // The whitelabel layer supplies its own default. An unset key must stay
  // undefined here, or a backend-supplied favicon can never take precedence.
  it('resolves to undefined when neither tier sets it', () => {
    expect(getConfig('WHITELABEL_FAVICON')).toBeUndefined();
  });

  it('resolves normally once a tier sets it', () => {
    injected({ WHITELABEL_FAVICON: '/custom.ico' });

    expect(getConfig('WHITELABEL_FAVICON')).toBe('/custom.ico');
  });
});

describe('unregistered keys', () => {
  it('throws for a key no tier carries', () => {
    expect(() => getConfig('NOT_A_KEY' as ConfigKey)).toThrow('ENV: NOT_A_KEY not registered');
  });

  it('throws for an unregistered key even when a tier carries it', () => {
    injected({ NOT_A_KEY: 'value' });

    expect(() => getConfig('NOT_A_KEY' as ConfigKey)).toThrow('ENV: NOT_A_KEY not registered');
  });

  it('registers thirteen keys', () => {
    expect(CONFIG_KEYS).toHaveLength(13);
  });
});

describe('boolean handling', () => {
  it.each([
    ['true', true],
    ['True', true],
    ['TRUE', true],
    ['false', false],
    ['False', false],
    ['1', false],
    ['yes', false],
    ['', false],
  ])('reads %o as %o', (value, expected) => {
    atBuild({ ENTERPRISE: value });

    expect(getConfigFlag('ENTERPRISE')).toBe(expected);
  });

  it("reads the string 'true' as the boolean true", () => {
    atBuild({ ENTERPRISE: 'True' });

    expect(getConfigFlag('ENTERPRISE')).toBe(true);
  });

  it('falls back to the default for an unset boolean key', () => {
    expect(getConfigFlag('WHITELABEL_ENABLED')).toBe(false);
  });
});

describe('getConfigValue', () => {
  it('returns an empty string for a key with no default', () => {
    expect(getConfigValue('WHITELABEL_FAVICON')).toBe('');
  });

  it('returns a boolean default as a string', () => {
    expect(getConfigValue('ENTERPRISE')).toBe('false');
  });
});

describe('wasSetByDeployment', () => {
  it('is false for a value that comes from the default', () => {
    // ENTERPRISE defaults to false, but that must not drive the plugin
    // fallback — only an explicitly set ENTERPRISE does.
    expect(isPluginEnabled('IRENE_ENABLE_PENDO')).toBe(false);
  });

  it('is true for an injected ENTERPRISE as well as a build one', () => {
    injected({ ENTERPRISE: 'false' });

    expect(isPluginEnabled('IRENE_ENABLE_PENDO')).toBe(true);
  });
});

describe('isPluginEnabled', () => {
  // Each case was verified against the Ember implementation's output for the
  // same inputs.
  const plugins: ConfigKey[] = ['IRENE_ENABLE_PENDO', 'IRENE_ENABLE_MARKETPLACE'];

  it('falls back to the plugin default when neither key is set', () => {
    for (const key of plugins) {
      expect(isPluginEnabled(key)).toBe(false);
    }
  });

  it('follows the inverse of ENTERPRISE when the plugin key is unset', () => {
    atBuild({ ENTERPRISE: 'false' });

    for (const key of plugins) {
      expect(isPluginEnabled(key)).toBe(true);
    }
  });

  it('is false when ENTERPRISE is set', () => {
    atBuild({ ENTERPRISE: 'true' });

    for (const key of plugins) {
      expect(isPluginEnabled(key)).toBe(false);
    }
  });

  it('prefers an explicit plugin key over ENTERPRISE', () => {
    atBuild({ ENTERPRISE: 'true', IRENE_ENABLE_PENDO: 'true' });

    expect(isPluginEnabled('IRENE_ENABLE_PENDO')).toBe(true);
    expect(isPluginEnabled('IRENE_ENABLE_MARKETPLACE')).toBe(false);
  });

  it('prefers an explicit false over a non-enterprise ENTERPRISE', () => {
    atBuild({ ENTERPRISE: 'false', IRENE_ENABLE_PENDO: 'false' });

    expect(isPluginEnabled('IRENE_ENABLE_PENDO')).toBe(false);
    expect(isPluginEnabled('IRENE_ENABLE_MARKETPLACE')).toBe(true);
  });

  it('reads an injected plugin key as well as a build one', () => {
    injected({ IRENE_ENABLE_PENDO: 'true' });

    expect(isPluginEnabled('IRENE_ENABLE_PENDO')).toBe(true);
    expect(isPluginEnabled('IRENE_ENABLE_MARKETPLACE')).toBe(false);
  });

  it('throws for an unregistered plugin key', () => {
    expect(() => isPluginEnabled('NOPE' as ConfigKey)).toThrow('ENV: NOPE not registered');
  });
});

describe('isWhitelabelEnabled', () => {
  it('is false when no tier sets WHITELABEL_ENABLED', () => {
    expect(isWhitelabelEnabled()).toBe(false);
  });

  it('is true when the build tier sets WHITELABEL_ENABLED', () => {
    atBuild({ WHITELABEL_ENABLED: 'true' });

    expect(isWhitelabelEnabled()).toBe(true);
  });

  it('is true when the injected tier sets WHITELABEL_ENABLED', () => {
    injected({ WHITELABEL_ENABLED: 'true' });

    expect(isWhitelabelEnabled()).toBe(true);
  });

  it('is false when a tier sets WHITELABEL_ENABLED to false', () => {
    atBuild({ WHITELABEL_ENABLED: 'false' });

    expect(isWhitelabelEnabled()).toBe(false);
  });
});

describe('buildConfigDefine', () => {
  it('emits only the registered keys', () => {
    const define = buildConfigDefine({
      IRENE_API_HOST: 'https://api.test',
      AWS_SECRET_ACCESS_KEY: 'must-not-ship',
    });

    expect(JSON.parse(define.__BUILD_CONFIG__ ?? '{}')).toEqual({
      IRENE_API_HOST: 'https://api.test',
    });
  });

  it('reads process.env when given no source', () => {
    expect(buildConfigDefine()).toHaveProperty('__BUILD_CONFIG__');
  });
});
