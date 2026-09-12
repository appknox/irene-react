import { CONFIG_KEYS, type ConfigKey } from './keys.ts';

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

export { CONFIG_KEYS, type ConfigKey };
