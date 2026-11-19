---
name: irene-react-patterns
description: How code is written in the irene-react monorepo (Appknox dashboard, React + TanStack Router/Query + Tailwind + Zustand). Use this skill whenever adding or changing anything in apps/dashboard or packages/* — a page, route, component, form, layout, API endpoint, service, query, mutation, store, websocket/live-update handling, normalized cache, configuration (getConfigValue, feature flags, whitelabel), translation, or test — and whenever porting a screen from the Ember app (irene). Also use it when the user asks where something should go, how a feature should be structured, or "how do we do X here", even if they don't name a specific pattern.
---

# irene-react patterns

A React port of Appknox's Ember dashboard (irene). New code should look like the
code around it. `CLAUDE.md` is the authority on styling, TypeScript, comments,
tests, storage and commits; read it first. This skill covers structure and
per-layer patterns.

## Map

```
apps/dashboard/src/
  routes/            thin TanStack file routes: guards, search params, loader, title, component
  features/<name>/   real code for one domain
    pages/<page>/    index.tsx + components/ hooks/ used only by that page
    components/ hooks/ queries/ schemas/ actions/ utils/ store.ts
    index.ts         public entry, only if something outside renders the feature
  components/ layouts/ hooks/ queries/ actions/ utils/   app-wide equivalents
packages/
  api/          endpoints, services, types, transforms, stores, normalization, request client
  websocket/    server push
  ui/           Ak* components, icons, svgs, styles/theme.css
  translations/ en.json + ja.json, akMT, <AkMessageTranslate>, FORMATS
  config/ constants/ enums/
```

## Where does it go?

Narrowest level that uses it; move up when a second user appears.

| What                                                                                                                      | Where                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| URL, guard, search params, title                                                                                          | `routes/…/<name>.tsx`                                                                                                   |
| Page                                                                                                                      | `features/<f>/pages/<page>/index.tsx`                                                                                   |
| Component: one page / one feature / app-wide                                                                              | `pages/<page>/components/` / `features/<f>/components/` / `src/components/`                                             |
| Generic, no app data or API                                                                                               | `packages/ui/src/components/ak-<name>/`                                                                                 |
| Endpoint paths / HTTP call / response types                                                                               | `packages/api/src/services/<domain>/endpoints.ts` / `service.ts` / `types.ts`                                           |
| Query keys + `xOptions()`                                                                                                 | `features/<f>/queries/` or `src/queries/`                                                                               |
| Form schema + typed field                                                                                                 | `features/<f>/schemas/<form>.ts`                                                                                        |
| **Action**: plain async fn taking `queryClient`; spans cache/stores/storage, or called from guards/loaders                | `actions/` (`endSession`, `setupUserAndOrgContext`)                                                                     |
| **Hook** (`use…`): re-renders on state, or tied to component lifetime. Hands work to actions (`useLogout` → `endSession`) | `hooks/` (`useOrganization`, `useDashboardWebsocket`)                                                                   |
| Client-only shared state                                                                                                  | Zustand: `features/<f>/store.ts` or `packages/api/src/stores/`                                                          |
| Server codes (status, platform, risk…)                                                                                    | `ENUMS` from `@irene/enums`, never raw numbers                                                                          |
| Client-named constants (HTTP statuses, hostnames, support email)                                                          | `@irene/constants`                                                                                                      |
| Deployment settings / release constants / backend config                                                                  | `@irene/config` / `@irene/config/product` / `configurationStore` (see [configuration.md](references/configuration.md))  |
| Live updates                                                                                                              | tag records in services, then `useWebsocketSignal` / `useWebsocketRecord` (see [websocket.md](references/websocket.md)) |

## Building a feature (bottom-up)

1. Endpoints, types, service in `packages/api`. Then query keys and options.
   See [api-and-data.md](references/api-and-data.md).
2. A thin route. See [routing.md](references/routing.md).
3. The page and its components. See [components-and-styles.md](references/components-and-styles.md).
4. Live updates if the data changes server-side. Usually tagging the record is
   enough. See [websocket.md](references/websocket.md).
5. Copy in **both** `en.json` and `ja.json`. Use `<AkMessageTranslate id>` in
   JSX, and `akMT()` in props, schemas, toasts and titles. Format dates and
   numbers through the named `FORMATS`.
6. Tests next to the code (MSW + factories, ≥90% coverage). See
   [testing.md](references/testing.md).
7. Porting from irene: carry every condition across. Record deliberate
   differences in `DESIGN-DECISIONS.md` and scenarios in `QA-SCENARIOS.md`.

## Everywhere

- JSDoc on every export, saying what it does and **why**.
- Import via package paths (`@irene/ui/ak-button`, `@/features/…`). Apps never
  use `@ui/*`, `@api/*` or `@config/*`.
- No `any`, `!`, `@ts-ignore` or `as unknown as`. Derive types from `z.infer`,
  `ReturnType`, enums or the route tree.
- Server data lives in TanStack Query. Stores hold client state only.
- Records that are pushed or shared across queries are tagged in the service
  (`tagRecordForCaching`).
- Component files stay under 350 lines of code (lint). Private helpers are
  `_prefixed` and not exported. Use `data-test-*` hooks for tests.

## Before finishing

```bash
pnpm lint:fix && pnpm lint && pnpm lint:types && pnpm --filter @irene/dashboard test
```
