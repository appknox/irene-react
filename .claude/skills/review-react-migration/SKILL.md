---
name: review-react-migration
description: Review React code written for a migrated screen against this repo's practices — porting fidelity, file placement, routing, data, forms, design system, styling, types, translations, embed, tests and the docs a migration owes. Use before raising a migration PR, when reviewing one, or when checking whether AI-written React here conforms to spec.
---

# Review a migrated screen

`CLAUDE.md` states the conventions; this is the pass that catches where they are
broken. Work down it in order: the early sections cost the most to fix after
merge, the later ones a lint run will find for you.

Nothing here is advice. Each line is a check with a verdict.

## 0. Before reading the diff

- [ ] The irene source for the screen is open beside it. `appknox/irene` is the spec — not `migration/`, not the React code's own comments.
- [ ] You know which commit of irene it was ported from. A screen ported from a stale checkout is already behind; see `migration/Drift Control.md`.
- [ ] `DESIGN-DECISIONS.md` and `QA-SCENARIOS.md` are open. A difference not listed in the first reads as a defect to QA; a state not listed in the second will not be tested.

## 1. Fidelity — the only part nothing automates

| Check                                                             | The tell                                            |
| ----------------------------------------------------------------- | --------------------------------------------------- |
| Every guard in the irene template exists here                     | A `{{#if}}` with two conditions ported as one       |
| Loading, empty, error and partial states all render               | An empty state shown while the query is pending     |
| Permission, role and feature checks carried over                  | A button the Ember template hid from a member       |
| Pagination, sort and filter defaults match irene's                | Page size silently 10 where irene asks for 25       |
| Every `analytics.track` has a counterpart, or the gap is recorded | Silent loss; no analytics layer exists in React yet |
| Numbers, dates and plurals go through the formatters              | A raw `toLocaleDateString()` beside `FORMATS`       |
| Deliberate differences are in `DESIGN-DECISIONS.md`               | A reviewer or QA finding it first                   |

A guard that looks redundant is ported anyway, with a comment saying why it looks
redundant.

## 2. Where the code went

- [ ] Screen code sits under `apps/dashboard/src/features/<area>/` in the folder that names its kind — `pages`, `components`, `queries`, `schemas`, `hooks`, `actions`, `stores`, `utils`. Nothing screen-specific in `src/components`, which is app chrome.
- [ ] A new API call is a service: `packages/api/src/services/<area>/` with `endpoints.ts`, `types.ts`, `service.ts`, `index.ts`. Paths only in `endpoints.ts`, built off `API_NAMESPACES`; no URL string in a component or a query file.
- [ ] A generic control is an `ak-*` in `packages/ui`, not a local copy. 24 exist — check before writing a 25th.
- [ ] An irene enum value is read from `@irene/enums`, an HTTP status or shared number from `@irene/constants`. No magic literal re-declared locally.
- [ ] File and folder names are kebab-case; the component inside is `PascalCase`.

## 3. Routing

- [ ] Routes are file routes under `src/routes`, and `routeTree.gen.ts` is regenerated, not hand-edited.
- [ ] The route carries `staticData.pageTitle`, as a function so the tab follows the locale. A breadcrumb comes from the route's static data — never passed down as an items array.
- [ ] Query and path params are typed: `validateSearch` with a zod schema, params read through the route API rather than `window.location`.
- [ ] Tab, filter and page state live in router search, not `useState`. Internal links go through the router's `Link`, or an `ak-*` link wired to it with `createLink`; a plain `<a>` to an internal path reloads the document.
- [ ] An old URL that still has to work is a `beforeLoad` redirect with `replace: true`, not a rewrite of the link that pointed at it.
- [ ] A route that redirects to another page goes through `redirectToPage`. A bare `redirect({ to })` skips the root guard, which does not run again inside a navigation it already guarded, and renders the React page at a URL the ledger still owns.
- [ ] The screen's `RouteShell` is gone, and the Ember ledger entry handled per the `serve-a-migrated-page` skill — removed for a React route, kept for an embedded pane.

## 4. Data

- [ ] Query options and cache keys live in the feature's `queries/`, as a `queryOptions()` factory plus a keys object whose entries build on `all()`. No inline `queryKey` array in a component.
- [ ] A mutation invalidates the narrowest key that is now wrong. Invalidating a parent reloads tables the user never touched, which reads to them as a page reload.
- [ ] A toggle or counter that the response already confirms is written into the cache rather than refetched.
- [ ] A table shows its skeleton on `isPending || isPlaceholderData`, and the skeleton mirrors the real columns so widths do not jump when data lands.
- [ ] API types mirror the server's own field names (`'first-name'`), and a transform normalises them. Components never read a hyphenated key.
- [ ] Errors go through `@irene/api/utils/errors` — `getApiErrorStatus`, field errors keyed by field. No `error.response.data` reached into by hand.
- [ ] A request that can hang carries `AbortSignal.timeout(REQUEST_ABORT_TIMEOUT_MS)`.
- [ ] A record held in more than one list is written through the normalizer, not patched in each cache by hand.
- [ ] Realtime updates use `@irene/websocket`'s hooks; no bare `new WebSocket` and no polling loop beside one.

## 5. Forms

- [ ] `useForm` with `zodResolver`, the schema in the feature's `schemas/`. No hand-rolled validation in the component.
- [ ] The schema is built by a function so its messages resolve per render, and the type is `z.infer<ReturnType<typeof buildXSchema>>`.
- [ ] Fields are built from `createAkFormField<Schema>()`, so every `name` is checked against the schema.
- [ ] `<form noValidate>`, submit through `handleSubmit`, and the submit control disabled while the mutation is pending.
- [ ] The form unmounts with its container rather than being reset from outside, so the next opening starts clean.
- [ ] Server-side field errors are mapped back onto the fields; a 429 is left to the rate-limit notice rather than toasted twice.

## 6. Design system

- [ ] The screen composes `ak-*` components. A one-off restyle of a primitive from the call site is a prop or a variant on the component instead.
- [ ] A new `ak-*` ships `index.tsx`, `variants.ts` with `cva`, `index.test.tsx` and `index.stories.tsx`, and is reachable through the exports map — no deep relative import.
- [ ] Variants are named for intent, not appearance, and every variant combination the screen uses actually renders (check the story).
- [ ] State is exposed as `data-*` on the element (`data-slot`, `data-variant`, `data-loading`) so it can be styled and asserted.
- [ ] A component rendering someone else's element takes `asChild`, and classes for an inner part arrive as a `*Props` object.

## 7. Styling

- [ ] Classes inline in `className`, repeated rather than hoisted into a constant, and never exported for another module.
- [ ] `cn()` only where something is combined. A lone string literal stays a string literal; a class list in a variable, object value or prop goes through `cn()`.
- [ ] Tokens for colour, radius, shadow and type, from `packages/ui/styles/theme.css`.
- [ ] Spacing takes two decimals. `gap-x-4.375` generates nothing — no class, no error, no layout. Sizes, limits and offsets may be arbitrary; rhythm may not.
- [ ] Unit conversion is deliberate: irene's root is 14px, the scale counts 4px, so `1.25em` is 17.5px and `w-14` is 56px.
- [ ] Portaled content — drawer, modal, menu, popover, select — carries `font-sans text-foreground`, since it mounts outside the embed root and inherits the host's typography otherwise.
- [ ] Long class lists are wrapped by variant group (`eslint --fix` does it).

## 8. TypeScript

- [ ] No `@ts-ignore`, `@ts-expect-error`, `any`, `never`, non-null `!` or `as unknown as`. Fix the type.
- [ ] Types are derived, not retyped: route paths from `FileRouteTypes['to']`, props from `ComponentProps<'button'>`, variants from `VariantProps<typeof x>`, form types from the schema.
- [ ] Imports go through package paths (`@irene/ui/ak-button`, `@/features/...`). No relative walk, no `@ui/*`, `@api/*` or `@config/*` from an app.

## 9. Component shape and code style

- [ ] Props are `Readonly<XProps>` and documented once, in the JSDoc `@param` — not again above the prop.
- [ ] A `.tsx` exports components only. A helper or constant beside one breaks fast refresh; move it to a sibling file.
- [ ] Explicit `<Fragment>`, never `<>`.
- [ ] A small single-use hook stays inline; extract it when it is reused or substantial.
- [ ] Under 350 lines, split by what the parts do rather than to clear the number. A component defined inside another is hoisted out and handed props.
- [ ] Comments state what the code does and why, in one declarative sentence, naming the prop, endpoint, flag or condition. None restating a class list or JSX structure, and none referring to Ember or irene in app code.
- [ ] Early returns, `curly` on every block, blank lines around multiline statements and `return` (autofixed).

## 10. Translations

- [ ] Every new key is in `packages/translations/translations/en.json` **and** `ja.json`. A key ported from irene carries irene's own Japanese; a key new to React carries English in `ja.json`.
- [ ] `akMT('literal.id')`. A ternary over two ids hides both from the extractor and the lint rule rejects it — branch on the resolved text instead.
- [ ] No user-facing string left in the TSX, including `aria-label`, `title` and `placeholder`.
- [ ] Markup inside a message lives in the message, which the generator registers as a rich id — not assembled from two keys or interpolated JSX.

## 11. Configuration and storage

- [ ] No new `@irene/config` key. Twelve are registered and a thirteenth means a deployment change; a build-fixed value belongs in `@irene/config/product`.
- [ ] Browser storage keys are namespaced `irene:<name>`, including keys built from a value.
- [ ] Nothing reads `import.meta.env` directly; config is read through the package.

## 12. Embed

- [ ] A screen a host renders is registered in `EMBEDDABLE_PAGES`, loaded lazily, with a placeholder shaped like its own frame where it draws one.
- [ ] The Ember route's own data loading for the replaced screen is stripped, and its `{{page-title}}` left alone unless the React screen switches panes itself.
- [ ] `pnpm build:embed` has been run and the staged stylesheet checked with a hard reload.
- [ ] Nothing in the pane assumes it owns the document — no `body` styling, no fixed overlay sized to the viewport that the host already positions.

## 13. Tests

- [ ] Scenarios through MSW with factories from `apps/dashboard/tests/factories`, rendered with `renderAtRoute`. No mocked service module standing in for a request.
- [ ] Factories use faker and take `overrides`; a type with several shapes gets a builder per shape.
- [ ] Assertions read the built object, never the literal faker produced.
- [ ] Test names state the behaviour. Queries go through `data-test-*` — there is no `testIdAttribute`, so `getByTestId` does not work.
- [ ] What a user sees is asserted, not internals. A skeleton is tested through its parent's loading state, not on its own.
- [ ] The failure paths have cases: empty list, request refused, permission withheld, request abandoned.
- [ ] Coverage thresholds in `vitest.coverage.ts` pass — they fail the run, they do not warn.

## 14. Accessibility

- [ ] Interactive things are buttons and links. A clickable row carries `tabIndex`, a key handler for Enter and Space, and a name.
- [ ] Every icon-only control has an accessible name; decorative icons are `aria-hidden`.
- [ ] A busy control sets `aria-busy`, an invalid field `aria-invalid`, a live region `aria-live`.
- [ ] Focus is handled when a drawer or modal opens and when it closes.

## 15. What the migration owes the repo

- [ ] `DESIGN-DECISIONS.md` has a row for every deliberate difference, and a known gap that is not a decision is listed as a gap.
- [ ] `QA-SCENARIOS.md` has the screen's scenarios, including the states only an MSW scenario can produce (`?mock=<area>:<name>`).
- [ ] The irene commit the screen was ported from is recorded, so its backlog can be read later.
- [ ] Commits read `VERB: one sentence`, no body, no co-author trailer.

## 16. Then run it

```
npx turbo type-check lint test --force
pnpm lint:css
```

Turbo caches hard; without `--force` a green run may be yesterday's.
