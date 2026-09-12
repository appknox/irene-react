/**
 * The config keys CI may bake in and a server may inject.
 *
 * One definition, shared by the resolver and by every app's Vite `define`, so a
 * key cannot be added to the build without the resolver knowing about it.
 *
 * These names match irene's exactly. Vite's `define` imposes no prefix, which is
 * why we use it instead of `import.meta.env.VITE_*` — a prefix would rename all
 * twelve keys and break seven whitelabel configs and both regional pod specs.
 */
export const CONFIG_KEYS = [
  'IRENE_API_HOST',
  'IRENE_SHOW_LICENSE',
  'IRENE_ENABLE_PENDO',
  'IRENE_ENABLE_MARKETPLACE',
  'IRENE_POSTHOG_API_KEY',
  'IRENE_POSTHOG_API_HOST',
  'ENTERPRISE',
  'WHITELABEL_ENABLED',
  'WHITELABEL_NAME',
  'WHITELABEL_LOGO',
  'WHITELABEL_THEME',
  'WHITELABEL_FAVICON',
] as const;

export type ConfigKey = (typeof CONFIG_KEYS)[number];
