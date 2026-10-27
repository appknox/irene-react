# Running React inside Ember: what each pattern costs

Working notes from building each pattern against the real apps, not a literature
review. Every claim here is something that was run; anything unverified says so.

The question these experiments answer is narrow: **can we keep shipping Ember
features while React takes over screen by screen, with no freeze?** A pattern
that works but stops Ember development for a week fails that test.

## The two axes

The options are not a flat list. Each pattern is one choice on each of two axes,
which is why some combinations are untested and some are nonsense.

**Delivery** — how React code reaches the Ember page:

|                        |                                                             |
| ---------------------- | ----------------------------------------------------------- |
| `D1` auto-import       | Ember's webpack imports the workspace package directly      |
| `D2` script bundle     | React builds its own file; Ember loads it with a script tag |
| `D3` module federation | Ember pulls React code over the network at runtime          |

**Mounting** — how it renders once it is there:

|                     |                                                                   |
| ------------------- | ----------------------------------------------------------------- |
| `M1` island         | A modifier calls `createRoot` on a `div` inside an Ember template |
| `M2` whole route    | An Ember route is an empty mount point; React owns the screen     |
| `M3` custom element | React is wrapped as a web component, usually in shadow DOM        |

## Test fixture

The same probe component is used for every pattern so the comparisons mean
something. It deliberately touches each thing we expect to break:

| Probe element                  | What it tests                           |
| ------------------------------ | --------------------------------------- |
| Tailwind-styled markup         | Preflight against irene's `_reset.scss` |
| A Radix-based `ak-*` component | Portals escaping their container        |
| A `@irene/api` query           | Two caches holding the same record      |
| `akMT` translation             | Two i18n stacks on one page             |
| A tracked Ember arg passed in  | Reactivity across the boundary          |

## Scorecard

Filled in as each pattern is run. Empty rows are not yet tested.

|                              | Build | Bundle | Dev loop | Deploy | State | Portals/CSS | Tests |
| ---------------------------- | ----- | ------ | -------- | ------ | ----- | ----------- | ----- |
| `D1+M1` auto-import island   |       |        |          |        |       |             |       |
| `D1+M2` auto-import route    |       |        |          |        |       |             |       |
| `D2+M1` script bundle island |       |        |          |        |       |             |       |
| `D3+M1` federated island     |       |        |          |        |       |             |       |
| `*+M3` custom element        |       |        |          |        |       |             |       |

## Prior art worth knowing

Two write-ups shaped what these experiments look for.

[Mainmatter, December 2025](https://mainmatter.com/blog/2025/12/12/react-ember/)
builds the island pattern and reports that reactivity across the boundary works
— a tracked arg re-renders the React tree. Their warnings are the useful part:
keep Ember in charge of routing, because two routers fight over query params;
Ember's test waiters do not know about React, so tests need `act()`; and
transparent state sharing between the two is where the complexity explodes.
Their setup assumes a Vite-based Ember, which irene is not, so the build half
of their post does not transfer.

[Envoy](https://envoy.com/builders/rendering-react-inside-ember) ran this in
production. Three findings matter for us. They started with an npm package and
**moved off it to module federation because the deployment coupling was the
bottleneck** — the React repo could not ship without a dashboard rebuild, which
is exactly the freeze we are trying to avoid. They isolated CSS with shadow DOM
after prefixing and `!important` became unmaintainable, and then had to make
their UI components shadow-aware via context because portals escaped to
`document.body`. And they kept props to contextual data only, on the grounds
that deep prop coupling defeats the point.

One fact from them is load-bearing for every pattern here: **Glimmer only
touches DOM nodes bound to tracked values**, so a plain `div` handed to React is
not reconciled out from under it.

## Bottlenecks

### `D1+M1` — auto-import delivery, island mounting

Branch `claude/embed-01-auto-import-modifier` on both repos. It builds and the
island ships inside Ember's own `irene.js`.

**No second server.** This is the pattern's main advantage and it is worth
stating plainly: Ember's webpack compiles the React source into the Ember
bundle, so there is one server, one build and one deploy. The Vite dev server
and the path proxy are not involved at all.

That is also the cost. One deploy means the React code cannot ship without an
Ember release — the coupling Envoy moved off module federation to escape.

**1. irene already had React 18, via Storybook.** `npm ls react` resolved
18.3.1 before anything was added, while the dashboard is on 19.3 and
`@irene/ui` peer-depends on ^19.3. A React 19 component against an 18 runtime
breaks on the new hooks. Fixed with an explicit dependency plus an `overrides`
entry; worth knowing that the collision is there by default.

**2. The linked package resolves React from its own directory.** `@irene/embed`
is linked from outside the app, so webpack looked for React next to the package
and failed on `react/jsx-runtime`. Fixed with `resolve.alias` in
`ember-cli-build.js`, which doubles as the guarantee that the page holds one
React instance.

**3. The same resolution problem again, in TypeScript.** `tsc` repeated the
failure independently and needed `paths` entries — pointed at
`@types/react`, not at the runtime package, or the mapping shadows the
declarations and every JSX tag becomes `any`. So the same fact is configured
twice, in two tools, and they fail differently.

**4. `jsx` had to be turned on app-wide.** `"jsx": "react-jsx"` in
`tsconfig.json` applies to the whole Ember app, not just the embedded packages.

**5. A classic template cannot import.** `.hbs` has no import statement, so
every React component has to be re-exposed as a field on a backing class
before a template can name it. With `.gjs` this would not apply, but irene is
`.hbs` throughout — 916 components.

**6. `@irene/ui` ships no CSS.** Its exports are raw `.tsx`, it has no build
script, and Tailwind v4 generates CSS in the _consuming_ app. Ember needed its
own Tailwind pipeline: `@tailwindcss/cli` plus an entry stylesheet that
`@source`s the React directories, built by a `build:react-css` script and
pulled in with `app.import`. 96 KB of CSS, built in ~300ms. It is a second
build step that nothing triggers automatically.

### The real page, not a probe

The probe was then replaced with the actual dashboard home page. It compiles
and ships inside Ember's bundle. Four more things surfaced.

**7. A real page is not an island.** `useLogout` calls `useNavigate` and
`useRouter`, which throw outside a `RouterProvider`. So the page cannot be
mounted on its own: it needs the router, the query client, the translations
provider and the toaster around it. Mounting one real page pulls in the whole
app shell, which makes `M1` and `M2` the same thing in practice for anything
bigger than a leaf component. The router is given a memory history so it does
not fight Ember for the address bar.

**8. The page is app code, not a package.** It imports through the `@/` alias,
so Ember's webpack needed `apps/dashboard/src` aliased and added to the
babel-loader include list. There is no packaged boundary to depend on.

**9. The React dependency tree is invisible to Ember.** `@tanstack/react-query`,
`@tanstack/react-router`, `@irene/api`, `@irene/translations` and `@irene/ui`
all failed to resolve, because pnpm installs them against the dashboard.
Fixed with `resolve.modules` pointing at `apps/dashboard/node_modules` and the
workspace root.

**10. Vite-only syntax has no webpack equivalent out of the box.** `?react` SVG
imports needed `@svgr/webpack`; `*.module.css` needed CSS modules turned on —
and the obvious fix, adding a rule, collides with ember-auto-import's own
`.css` rule and chains two css-loaders. The working fix is auto-import's
`cssLoaderOptions` hook with `modules: { auto: true }`.

**11. `__BUILD_CONFIG__` had to be reproduced.** `@irene/config` is TypeScript
and `ember-cli-build.js` is CommonJS, so it cannot call `buildConfigDefine()`.
The twelve config keys are duplicated into a `DefinePlugin` entry instead —
a list that will drift.

### Preflight is not the problem I predicted

I expected Tailwind's Preflight to be the biggest hidden cost. Reading the
generated CSS against `app/styles/_reset.scss` says otherwise. irene already
ships a Meyer-style reset that sets `margin: 0; padding: 0; border: 0;
font-size: 100%; font-weight: normal` across a long element list, plus
`box-sizing: border-box` and `list-style: none`. Preflight sets
`box-sizing: border-box; margin: 0; padding: 0; border: 0 solid` on `*` and
`h1`–`h6 { font-size: inherit; font-weight: inherit }`. They are the same
reset, one generation apart.

Preflight's `border: 0 solid` is in fact what _fixes_ the invisible-border
problem, rather than causing it. The genuine differences are narrow and worth
checking by eye rather than fearing in the abstract: `html` gains
`line-height: 1.5` and a default font stack, `b`/`strong` become `bolder`
rather than `bold`, and form controls are normalised. That is a short list, not
a restyle of the app.

### Mounted on the real route

The probe route was dropped and the React page put where it actually belongs:
`/dashboard/home`, which irene already has, guard and all. The template went
from `<HomePage />` to `<div {{react this.DashboardHome}}></div>`.

**12. Migrating a screen is a two-line template change.** This is the pattern's
best property. Ember's route keeps its own `beforeModel` guard — the one that
sends an account with neither storeknox nor security permission to the projects
list — and only the rendering swaps. The URL, the guard and the breadcrumb
stay Ember's.

**13. The React route's loader does not run, so its stores stay empty.**
`HomePage` reads `organizationStore` and `configurationStore` through
`useOrganization` and `useServerConfiguration`. Those are filled by the React
route tree's loaders, which a one-route embed never executes. The embed has to
call `loadConfiguration` and `setupUserAndOrgContext` itself, which means the
embed knows what the page needs — exactly the coupling Envoy warned about,
arriving through the back door.

**14. Teach every resolver separately, or declare the boundary.** The same
resolution fact had to be configured in webpack, then in `tsc`, then in
Tailwind's CSS resolver, and then in `tsc` again for the whole React
dependency tree. The fourth time is where it stops being worth it: the fix is
to stop Ember's TypeScript following the import at all, and declare
`@irene/embed` as an ambient module in `types/`. The React packages are then
type-checked by their own toolchain, which is where that belongs.

**15. Vite's `define` and webpack's `DefinePlugin` do not substitute alike.**
This one only showed up at runtime, as `SyntaxError: Unexpected token ':'`
inside `@irene/config`. Both replace the identifier with source text, but
`buildConfig` is written as `(): ConfigSource => __BUILD_CONFIG__`, so the
object lands directly in an arrow function's body — where a bare `{` opens a
block and the first key reads as a label. esbuild parenthesises the
replacement; webpack does not. The fix is to wrap the JSON in `( )` by hand.

Worth noting how it failed: the build was green, the module was transpiled
correctly, and the error surfaced only when the route was visited. Anything
relying on `define` needs checking in a browser, not in a build log.

### Styling: the layer trap

Tailwind v4 emits everything inside `@layer utilities`. **Unlayered CSS beats
layered CSS regardless of specificity or source order**, and irene's
stylesheets are entirely unlayered — so `_reset.scss`'s `padding: 0` on a bare
`div` beat `.p-4`, and every utility on an embedded component silently did
nothing. No build error, no console warning.

The tidy fix does not work here. `packages/ui/styles/index.css` already
declares a `legacy` layer for exactly this case, but wrapping `app.scss` in it
changes nothing: `ember-css-modules` compiles every `.scss` in the app
separately and concatenates them, so `_reset.scss` is emitted standalone and
stays unlayered while the wrapper wraps an empty shell.

What works is the other direction — import Tailwind's parts _without_
`layer()`, so the utilities come out unlayered and win on ordinary specificity,
class selector over element selector. No change to irene's CSS at all.

**16. Preflight is unnecessary, and its role is not what v3 taught.** In v4
`.border` emits `border-style: var(--tw-border-style)` itself, so borders do
not depend on preflight. Leaving it out means the embed has no effect on
Ember's own pages.

**17. But some of preflight is load-bearing, and links show it first.** irene's
reset never sets a link colour; it relies on nothing, and preflight's
`a { color: inherit }` is what React components assume. Without it every link
in the island renders browser-blue. The fix is a small base stylesheet scoped
to `[data-react-root]` carrying the preflight rules the components actually
depend on — links, form controls inheriting font and colour, headings
inheriting size and weight, and media defaulting to `display: block`. Scoped,
so Ember's pages stay untouched.

**19. Scoping a reset raises its specificity, which breaks the utilities it
exists to support.** The first version of the scoped base used
`[data-react-root] h1` — specificity (0,1,1), which beats `.text-2xl` at
(0,1,0). Every heading in the embedded page flattened to body text, because a
rule meant to _enable_ Tailwind was now overriding it. Preflight avoids this
by using bare element selectors at (0,0,1). The fix is to wrap both halves in
`:where()`, which contributes nothing, putting the scoped reset at (0,0,0) —
below everything, which is where a base layer belongs.

Worth generalising: a reset copied out of preflight and scoped to a container
is not the same reset. The scope has to be specificity-free or it inverts the
cascade it was borrowed from.

### Routing: the island needs a link bridge

**18. Every link in the island goes nowhere.** The embedded page is built with
TanStack `<Link>`, which renders an anchor and then intercepts the click into
_its_ router — the memory-history one, whose tree holds a single route. So
every link resolved to that router's not-found screen.

The bridge is a capture-phase click listener on the mount element: find the
closest `a[href]`, ignore modified clicks, new tabs and off-origin targets,
then `preventDefault`, `stopPropagation` and hand the path to Ember's
`RouterService` — `recognize()` first, falling back to a document load for a
path Ember does not own. Capture phase matters: React's own handler must never
see the event.

This is the concrete form of Mainmatter's "keep Ember in charge of routing".
It is about twenty lines, it belongs in the modifier, and nothing works
without it.

### Data: both apps fetch the same seven endpoints

**20. The duplication is exact, and the URLs are identical.** On every load of
an embedded page both apps request `api/v2/server_configuration`,
`api/v2/frontend_configuration`, `api/v2/dashboard_configuration`,
`api/organizations`, `api/vulnerabilities`, `api/users/:id` and the
organization me/membership pair. Ember's `authenticated.model()` loads them for
its own services; the embed's loader then calls `loadConfiguration` and
`setupUserAndOrgContext` to fill React's stores.

**21. Bridging above the service layer does not work.** The obvious design —
Ember stashes each payload, the embed writes it into the query cache with
`setQueryData` — is unsound here, because the services are not uniform.
`getFrontendConfiguration` returns the response as it arrived, but
`getOrganizations` returns `transformPaginatedResponse(page)`, turning
`{ results, count, next, previous }` into `{ items, count, hasNext, ... }`.
Seeding the raw envelope under that query key gives every reader
`items: undefined`, and nothing catches it: `setQueryData` is untyped against
what the query function actually returns.

So the handoff sits **below** the services instead. Ember offers each response
by path; React's axios client swaps in a one-shot adapter for a GET it has been
given. Every service still runs its own transform, on bytes that did not cost a
second request.

#### What can go wrong with it

Four things, and the design answers three of them by construction.

_Stale data._ A response handed over is taken **once**. The first asker gets
it and it is removed, so any later refetch is a real request. The handoff can
collapse the duplicate boot fetch and nothing else.

_Account switch._ The map lives on `globalThis`, so it dies with the document.
Both sign-out and account switch in irene are full page loads, which means
there is no path where one account's payload reaches another's session.

_URL spelling._ The two apps write the same endpoint differently — one
relative, one absolute, sometimes with a query. The key is the path with the
query stripped, so they match. When they do not, the handoff simply misses and
a real request happens: it degrades to today's behaviour rather than breaking.

_The one that does not self-correct:_ the shared-endpoint list is written by
hand in `app/utils/response-handoff.ts`. An endpoint renamed on one side
silently stops matching, and the only symptom is the duplicate request coming
back. Nothing fails, nothing warns. That is the maintenance cost of this
bridge, and it is the reason to keep the list short and only for boot.

### A page that needs route params: the reset password screen

Mounted on irene's own `/reset/:token`, replacing
`<UserLogin::ResetPassword @token={{@model.token}} />`. Chosen because it is a
finished React page that depends on a route parameter — and because it is
unauthenticated, so the session and store questions do not confuse the result.

**22. A finished page does not take props.** The obvious shape —
`<ResetPasswordPage token={...} />` — is not available. The page calls
`getRouteApi('/_unauthenticated/reset/$token').useParams()`. It does not accept
a token; it asks the router it is rendered under for one. So "pass props from
the Ember route" is the wrong mental model. What actually happens is: Ember's
`model.token` becomes a prop on the _embed wrapper_, the wrapper writes it into
the address of a memory history, and the page reads it back out as a route
param. Three hops for one string.

**23. That forces the whole route tree into the bundle.**
`getRouteApi('/_unauthenticated/reset/$token')` resolves against a route with
exactly that id, so the embed cannot use a hand-built tree of one route the way
the home page did — it has to use the real `routeTree.gen`. Every route in the
React app is now reachable from Ember's bundle, whether or not it is embedded.

Put together, these two say something about how far this pattern scales. A leaf
component takes props and embeds cleanly. A finished _page_ is coupled to its
route by id, so embedding one means embedding the router that defines it. The
more complete the page, the less it behaves like a component.

It works, and the end state is genuinely good: one server, one deploy, screens
migrate by editing a template, and Ember keeps the router. The costs are the
eleven build-config changes, a second Tailwind build step nothing triggers
automatically, no HMR for React code, and the loader coupling in finding 13.

The deployment property is the one to weigh. Everything ships in Ember's
bundle, so React work cannot reach production without an Ember release. For a
team trying to keep both moving without a freeze, that is the thing to check
against how often the two actually ship.
