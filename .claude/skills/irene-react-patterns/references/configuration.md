# Configuration

Choose by **who decides the value**:

| Decided by                   | Source                                              | Read with                                                                      |
| ---------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------ |
| Deployment (CI or container) | `@irene/config`, 12 registered keys                 | `getConfigValue`, `getConfigFlag`, `isPluginEnabled`, `isWhitelabelEnabled`    |
| Release                      | `@irene/config/product`                             | constants: `PRODUCT_VERSIONS`, `G_RECAPTCHA`, `PENDO_API_KEY`                  |
| Backend at runtime           | `configurationStore`, filled by `loadConfiguration` | `useServerConfiguration()`, `useWhitelabel()`, `configurationStore.getState()` |

## Deployment keys

Each key resolves through three sources, first match wins:

1. `window.runtimeGlobalConfig` (injected at container start)
2. `__BUILD_CONFIG__` (from CI env, via `buildConfigDefine` in `vite.config.ts`)
3. `DEFAULTS`

The keys are `IRENE_API_HOST`, `IRENE_SHOW_LICENSE`, `IRENE_ENABLE_PENDO`,
`IRENE_ENABLE_MARKETPLACE`, `IRENE_POSTHOG_API_KEY`, `IRENE_POSTHOG_API_HOST`,
`ENTERPRISE`, and `WHITELABEL_ENABLED` / `NAME` / `LOGO` / `THEME` / `FAVICON`.

- Strings: `getConfigValue(key)` (unset → `''`; API host `'/'` → `''`, meaning
  same origin).
- Flags: `getConfigFlag(key)`. Never compare raw values, because `'false'` is
  truthy.
- Pendo / Marketplace: always `isPluginEnabled(key)`. When unset they follow
  the inverse of `ENTERPRISE`.
- `getConfig(key)` gives the raw value, only when "unset" matters
  (`WHITELABEL_FAVICON`).
- Read inside functions, not in module constants. Unknown keys fail type-checking.
- **Never add a key** (every deployment would need it). Release-fixed public
  values go in `@irene/config/product`; backend-decided values come from
  `configurationStore` or org features.

## Backend config

`configurationStore` exposes getters (`isEnterprise()`, `socketHost()`,
`deviceFarmUrl()`) that fall back to the deployment keys. Boot doesn't wait
for it, so components reserve space until it arrives.

## Tests

`tests/setup.ts` resets both sources. Set the one you mean with string values,
then restore it:

```ts
beforeEach(() => {
  globalThis.__BUILD_CONFIG__ = { WHITELABEL_ENABLED: 'true' };
});
afterEach(() => {
  globalThis.__BUILD_CONFIG__ = {};
});
```

For backend config, answer the config endpoints via MSW with
`buildFrontendConfiguration` / `buildServerConfiguration`.
