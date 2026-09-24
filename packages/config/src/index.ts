/**
 * Runtime configuration.
 *
 * One file on purpose: an app's vite.config.ts imports buildConfigDefine from
 * here, and Node loads that before Vite's resolver exists. With no internal
 * imports there is nothing for it to fail to resolve.
 */

/**
 * Resolution runs in three tiers:
 *   1. injected  a server writes runtimeGlobalConfig at container start
 *   2. build     the build freezes __BUILD_CONFIG__ into the bundle
 *   3. fallback  everything else
 *
 * Injected wins over build so an operator can override a released value without
 * a rebuild.
 */

declare const __BUILD_CONFIG__: Record<string, string>;

/**
 * The config keys CI may bake in and a server may inject.
 *
 * One definition, shared by the resolver and by every app's Vite `define`, so a
 * key cannot be added to the build without the resolver knowing about it.
 *
 * Vite's `define` imposes no prefix, which is why we use it instead of
 * `import.meta.env.VITE_*` — a prefix would rename all keys and break configurations.
 */
export const CONFIG_KEYS = [
  'IRENE_API_HOST',
  'IRENE_SHOW_LICENSE',
  'IRENE_ENABLE_PENDO',
  'IRENE_ENABLE_MARKETPLACE',
  'IRENE_POSTHOG_API_KEY',
  'IRENE_POSTHOG_API_HOST',
  'IRENE_RECAPTCHA_SITE_KEY',
  'ENTERPRISE',
  'WHITELABEL_ENABLED',
  'WHITELABEL_NAME',
  'WHITELABEL_LOGO',
  'WHITELABEL_THEME',
  'WHITELABEL_FAVICON',
] as const;

export type ConfigKey = (typeof CONFIG_KEYS)[number];

/**
 * What a key can resolve to. Undefined means no tier set it and there is no
 * fallback — see WHITELABEL_FAVICON below.
 */
export type ConfigValue = string | boolean | undefined;

/** A tier's raw contents. Both tiers arrive as strings. */
type ConfigSource = Record<string, string>;

/**
 * WHITELABEL_FAVICON is absent on purpose. The whitelabel layer supplies its
 * own default, and an unset key here is what lets a backend-supplied favicon
 * take precedence.
 */
const DEFAULTS: Partial<Record<ConfigKey, string | boolean>> = {
  IRENE_API_HOST: 'https://api.appknox.com',
  IRENE_SHOW_LICENSE: false,
  IRENE_ENABLE_PENDO: false,
  IRENE_ENABLE_MARKETPLACE: false,
  IRENE_POSTHOG_API_KEY: '',
  IRENE_POSTHOG_API_HOST: '',
  IRENE_RECAPTCHA_SITE_KEY: '6LffPdIaAAAAANWL4gm7J6j9EJzKSuYEDAQ0Ry2x',
  ENTERPRISE: false,
  WHITELABEL_ENABLED: false,
  WHITELABEL_NAME: '',
  WHITELABEL_LOGO: '',
  WHITELABEL_THEME: 'dark',
};

const isKnownKey = (key: string): key is ConfigKey => CONFIG_KEYS.includes(key as ConfigKey);

/** Throw on a key nobody registered. */
function assertKnownKey(key: string): asserts key is ConfigKey {
  if (!isKnownKey(key)) {
    throw new Error(`ENV: ${key} not registered`);
  }
}

/**
 * Read the injected config on every call rather than once at module load.
 *
 * The `<script src="/runtimeconfig.js">` tag in `<head>` is blocking, so it does
 * run before the bundle today. Reading lazily keeps that from being load-order
 * dependent — adding `defer` or `type="module"` to that tag would otherwise
 * silently fall through to the build values.
 */
const injectedValues = (): ConfigSource => window.runtimeGlobalConfig ?? {};
const buildConfig = (): ConfigSource => __BUILD_CONFIG__;
const wasInjected = (key: ConfigKey) => key in injectedValues();
const wasSetAtBuild = (key: ConfigKey) => key in buildConfig();

/** True when a deployment set the key, rather than it falling back. */
const wasSetByDeployment = (key: ConfigKey) => wasInjected(key) || wasSetAtBuild(key);

/**
 * An API host of '/' means same-origin, which axios expresses as an empty
 * baseURL. Both tiers can carry it, so both go through this.
 */
const sameOriginAsEmpty = (key: ConfigKey, value: string) =>
  key === 'IRENE_API_HOST' && value === '/' ? '' : value;

/** The fallback for a key, or undefined where none is declared. */
const builtInConfigValue = (key: ConfigKey): ConfigValue => DEFAULTS[key];

/** Check if a config value reads as true. */
const readsAsTrue = (value: ConfigValue) => String(value).toLowerCase() === 'true';

/** Resolve one key: injected, then build, then the fallback. */
export function getConfig(key: ConfigKey): ConfigValue {
  assertKnownKey(key);

  if (wasInjected(key)) {
    return sameOriginAsEmpty(key, injectedValues()[key]);
  }

  if (wasSetAtBuild(key)) {
    return sameOriginAsEmpty(key, buildConfig()[key]);
  }

  return builtInConfigValue(key);
}

/** Resolve a key that carries an on/off switch. */
export const getConfigFlag = (key: ConfigKey): boolean => readsAsTrue(getConfig(key));

/** Unset keys read as an empty string. */
export const getConfigValue = (key: ConfigKey): string => String(getConfig(key) ?? '');

/**
 * Whether an optional product is switched on.
 *
 * Pendo and Marketplace do not resolve like other keys. When no deployment sets
 * them, they follow the inverse of ENTERPRISE — an enterprise deployment turns
 * them off, a hosted one turns them on — and only use their own fallback when
 * ENTERPRISE is unset too.
 */
export function isPluginEnabled(key: ConfigKey): boolean {
  assertKnownKey(key);

  if (wasSetByDeployment(key)) {
    return getConfigFlag(key);
  }

  if (wasSetByDeployment('ENTERPRISE')) {
    return !getConfigFlag('ENTERPRISE');
  }

  return readsAsTrue(builtInConfigValue(key));
}

/**
 * Whether this build was made for a whitelabel deployment.
 *
 * A build-time answer, unlike the address-bar check the login page uses to
 * decide whether Appknox answers its own support.
 *
 * @returns True when the deployment was built as a whitelabel.
 */
export const isWhitelabelEnabled = (): boolean => getConfigFlag('WHITELABEL_ENABLED');

/**
 * Build the `define` entry that freezes build-time config into an app's bundle.
 *
 * Every app's `vite.config.ts` must spread this in. A module that omits it
 * builds fine and then resolves `__BUILD_CONFIG__` as undefined at runtime, so
 * the build tier vanishes and every value silently falls back.
 *
 * Only the twelve registered keys are read, so an unrelated secret in the CI
 * environment cannot reach the client bundle.
 */
export function buildConfigDefine(env: NodeJS.ProcessEnv = process.env): Record<string, string> {
  const values = Object.fromEntries(
    Object.entries(env).filter(([key]) => CONFIG_KEYS.includes(key as ConfigKey))
  );

  return { __BUILD_CONFIG__: JSON.stringify(values) };
}
