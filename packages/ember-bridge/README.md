# @irene/ember-bridge

What the two apps need to agree on while the migration runs.

| Module                         | Read by                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------- |
| `@irene/ember-bridge/paths`    | the dev proxy, the handover, and the build that bakes the ledger into the image |
| `@irene/ember-bridge/handover` | the dashboard's authenticated route, to load Ember's document before rendering  |
| `@irene/ember-bridge/proxy`    | the dashboard's Vite config, to forward Ember-owned paths in development        |

`paths.ts` is the ledger. Migrating a screen is one deletion from it: the proxy
stops forwarding the path, the handover stops claiming it, and the deployed
server starts answering it with the React document. Nothing else changes.
