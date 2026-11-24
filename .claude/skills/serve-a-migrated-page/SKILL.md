---
name: serve-a-migrated-page
description: Put a migrated screen in front of users, either as a React route the server answers or as a React page embedded in irene's own Ember route. Use when a migration is finished and the page still shows the Ember screen, or when asked how a branch turns its page on.
---

# Serve a migrated page

`develop` starts every URL on Ember. A migration branch turns its own page on,
and nothing else, by editing the ledger — `packages/ember-bridge/src/paths.ts`.
That one map is read by the dev proxy, by the handover this app performs at
navigation, and by the script that bakes the list into the deployed image, so a
page cannot be claimed by one and missed by another.

Pick the way the page is served first. They are not variations of one change.

| The page is                                                 | Ember serves the document | Ledger key  | Go to  |
| ----------------------------------------------------------- | ------------------------- | ----------- | ------ |
| A React route on its own URL                                | No                        | Remove it   | Case A |
| A React pane inside an Ember route (tabs, chrome, sidebars) | Yes                       | **Keep it** | Case B |

Choose Case B while the URL still belongs to an Ember screen that owns chrome
the migration has not taken over — a tab bar, a breadcrumb trail, a wrapper.
Choose Case A once nothing Ember renders on that URL.

---

## Case A — the React server answers the URL

### 1. Remove the key

In `EMBER_PATHS`, delete the entry for the path. Keep every other key, including
the ones under it that are still Ember's.

```ts
// before
'/dashboard/organization': '/dashboard/organization',

// after — gone, so this app answers it
```

A deeper page that is still Ember's needs its own key, since the parent no
longer claims it:

```ts
'/dashboard/organization/settings': '/dashboard/organization/settings',
```

### 2. Check the route exists

`apps/dashboard/src/routes/` must hold a route for the path that renders the
screen rather than `RouteShell`.

### 3. Verify

```
pnpm --filter @irene/ember-bridge test
pnpm --filter @irene/dashboard test
```

`findEmberPath('<the path>')` must return `undefined`, and the paths under it
that are still Ember's must still return theirs. Add a case to
`packages/ember-bridge/src/paths.test.ts` for both.

---

## Case B — a React pane inside an Ember route

The URL stays Ember's, so **the ledger key stays**. Removing it here serves the
React route instead and the Ember chrome disappears.

### 1. Register the page

In `apps/dashboard/src/embed/pages/index.ts`, add it to `EMBEDDABLE_PAGES`:

```ts
Organization: lazy(async () => ({
  default: (await import('./organization')).Organization,
})),
```

A screen that needs its own router for tabs gets a file of its own in that
directory and is registered from there.

### 2. Mount it in the Ember template

In `apps/irene/app/templates/...`, replace the Ember component with the mount,
keeping the Ember loading UI as the placeholder:

```hbs
<ReactComponent @name='Organization'>
  <SomeNamespace::LoadingUi data-test-placeholder />
</ReactComponent>
```

Leave the route's own `{{page-title}}` alone unless the React screen switches
panes without the Ember route changing — then the screen names the browser tab
itself and the Ember template's title is removed.

### 3. Strip the route's data loading

Delete what the Ember route loaded for the screen it no longer renders. Leave
the rest of the route alone.

### 4. Build and verify

```
pnpm build:embed
pnpm --filter @irene/dashboard test
```

The embed stylesheet is staged under `apps/irene/public/assets/embed/` with a
name that does not change, so hard-reload irene when checking by hand.

---

## Both cases

- Edit the ledger on the migration branch, never on `develop`.
- One page per branch. A key you did not migrate stays as it is.
- The screens that only redirect — `/`, `/dashboard`, `/partner`, `/security` —
  send the visitor to a path the ledger owns. Point a redirect somewhere else
  only when that destination is served.
