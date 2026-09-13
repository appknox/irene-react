import { describe, expect, it } from 'vitest';
import { getConfig, getConfigFlag, getConfigText, isPluginEnabled } from '@irene/config/config';
import { CONFIG_KEYS, type ConfigKey } from '@irene/config/keys';

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

  it('uses an injected value even when it is empty', () => {
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

  it('leaves other hosts untouched', () => {
    atBuild({ IRENE_API_HOST: 'https://api.appknox.com/' });

    expect(getConfig('IRENE_API_HOST')).toBe('https://api.appknox.com/');
  });

  it('normalises only the host key', () => {
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
  it('throws rather than resolving', () => {
    expect(() => getConfig('NOT_A_KEY' as ConfigKey)).toThrow('ENV: NOT_A_KEY not registered');
  });

  it('throws even when a tier carries the key', () => {
    injected({ NOT_A_KEY: 'value' });

    expect(() => getConfig('NOT_A_KEY' as ConfigKey)).toThrow('ENV: NOT_A_KEY not registered');
  });

  it('registers exactly twelve keys', () => {
    expect(CONFIG_KEYS).toHaveLength(12);
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

  it('normalises a shell-style boolean', () => {
    atBuild({ ENTERPRISE: 'True' });

    expect(getConfigFlag('ENTERPRISE')).toBe(true);
  });

  it('treats an unset boolean key as its default', () => {
    expect(getConfigFlag('WHITELABEL_ENABLED')).toBe(false);
  });
});

describe('getConfigText', () => {
  it('returns an empty string for a key with no default', () => {
    expect(getConfigText('WHITELABEL_FAVICON')).toBe('');
  });

  it('stringifies a boolean default', () => {
    expect(getConfigText('ENTERPRISE')).toBe('false');
  });
});

describe('a key counts as configured only when a tier carries it', () => {
  it('ignores a value that comes from the default', () => {
    // ENTERPRISE defaults to false, but that must not drive the plugin
    // fallback — only an explicitly set ENTERPRISE does.
    expect(isPluginEnabled('IRENE_ENABLE_PENDO')).toBe(false);
  });

  it('counts an injected ENTERPRISE, not only a build one', () => {
    injected({ ENTERPRISE: 'false' });

    expect(isPluginEnabled('IRENE_ENABLE_PENDO')).toBe(true);
  });
});

describe('isPluginEnabled', () => {
  // Each case was verified against the Ember implementation's output for the
  // same inputs.
  const plugins: ConfigKey[] = ['IRENE_ENABLE_PENDO', 'IRENE_ENABLE_MARKETPLACE'];

  it('falls back to its own default when nothing is set', () => {
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

  it('is off on an enterprise deployment', () => {
    atBuild({ ENTERPRISE: 'true' });

    for (const key of plugins) {
      expect(isPluginEnabled(key)).toBe(false);
    }
  });

  it('lets an explicit plugin key beat ENTERPRISE', () => {
    atBuild({ ENTERPRISE: 'true', IRENE_ENABLE_PENDO: 'true' });

    expect(isPluginEnabled('IRENE_ENABLE_PENDO')).toBe(true);
    expect(isPluginEnabled('IRENE_ENABLE_MARKETPLACE')).toBe(false);
  });

  it('lets an explicit false beat a non-enterprise ENTERPRISE', () => {
    atBuild({ ENTERPRISE: 'false', IRENE_ENABLE_PENDO: 'false' });

    expect(isPluginEnabled('IRENE_ENABLE_PENDO')).toBe(false);
    expect(isPluginEnabled('IRENE_ENABLE_MARKETPLACE')).toBe(true);
  });

  it('reads an injected plugin key, not only a build one', () => {
    injected({ IRENE_ENABLE_PENDO: 'true' });

    expect(isPluginEnabled('IRENE_ENABLE_PENDO')).toBe(true);
    expect(isPluginEnabled('IRENE_ENABLE_MARKETPLACE')).toBe(false);
  });

  it('rejects an unregistered key', () => {
    expect(() => isPluginEnabled('NOPE' as ConfigKey)).toThrow('ENV: NOPE not registered');
  });
});
