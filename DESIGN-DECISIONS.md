# Design decisions

Where the React app deliberately differs from irene, and why. Every row needs a
product or design sign-off: QA compares screens against irene, so a difference
nobody has listed reads as a defect.

Anything not listed is a faithful port. Add a row when the difference is made,
not when someone notices it.

## Awaiting sign-off

| Change                                                            | Where                                                                | irene                                                                                                                                      | React                                                                                                                                                                                                                            | Why                                                                                                                                                                                                                        |
| ----------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Password fields can be revealed                                   | Every `AkInput` with `type="password"`                               | No reveal control                                                                                                                          | An eye button in the field switches between hidden and visible                                                                                                                                                                   | Passwords are 10 characters minimum and typed twice, which is where typos go unnoticed                                                                                                                                     |
| OIDC error screen offers a way on                                 | `/dashboard/oidc/redirect`, `/dashboard/oidc/authorize`              | Illustration and message, no controls                                                                                                      | "Dashboard Home" and "Login again" buttons, worded for the session                                                                                                                                                               | The screen was a dead end; the only ways on are the client restarting or signing in                                                                                                                                        |
| Return path travels in the URL                                    | `/login`                                                             | The blocked URL is kept in `sessionStorage` as `_lastTransitionInfo`                                                                       | It rides on the URL as `?redirectTo=`, validated as an internal path                                                                                                                                                             | A stored value outlives the sign-in it belongs to and can redirect a later session                                                                                                                                         |
| Names are required before sending                                 | `/invite/:token`                                                     | First and last name are unvalidated, and the API refuses them empty                                                                        | Both are required before the request is made                                                                                                                                                                                     | The server already requires them, so the old form spent a round trip to say so                                                                                                                                             |
| Not-found page says why                                           | Any unmatched URL                                                    | Heading and a home button                                                                                                                  | A line saying the link may be broken or the page moved                                                                                                                                                                           | "Cannot be found" alone leaves the reader unsure whether they mistyped or we broke it                                                                                                                                      |
| Status re-checks on refocus                                       | `/dashboard/status`                                                  | Each system is checked once, in the component constructor                                                                                  | Each check runs again when the window is focused                                                                                                                                                                                 | The tab is left open during an outage, reporting what was true when it was opened                                                                                                                                          |
| Appknox mark sized as an icon                                     | `/dashboard/home`                                                    | The mark fills the logo slot, up to 225x100px                                                                                              | 40x40px; a whitelabel logo keeps the full slot                                                                                                                                                                                   | On an Appknox host the slot is fed the favicon, a square mark that reads as oversized                                                                                                                                      |
| Outlined buttons are opaque                                       | Every `AkButton` with `variant="outlined"`                           | Transparent, except the home page's logout button                                                                                          | All of them carry the page background                                                                                                                                                                                            | A transparent secondary button reads as part of whatever sits behind it                                                                                                                                                    |
| Disabled buttons show a cursor                                    | Every `AkButton`                                                     | `pointer-events: none`, so the cursor is whatever the page behind it has                                                                   | `cursor-not-allowed`, with pointer suppression left only on anchors                                                                                                                                                              | A disabled button that the cursor ignores reads as unresponsive rather than unavailable                                                                                                                                    |
| Failure card names the status                                     | Any route whose guards or loaders fail                               | No failure card: the error reaches Ember's error route                                                                                     | "Error 500" under the hint, and in the support mail's subject                                                                                                                                                                    | A user reporting a failure had nothing to quote, and support nothing to search for                                                                                                                                         |
| Status table has fixed widths                                     | `/dashboard/status`                                                  | The table lays itself out                                                                                                                  | System 45%, Status 55%                                                                                                                                                                                                           | An unreachable system carries a hint under its status, so that column needs more room                                                                                                                                      |
| Mandated 2FA drops the email line                                 | `/login`, second-factor step                                         | The mandate notice is always followed by "We've sent a OTP code to your email", whatever the factor is                                     | The mandate notice stands alone; the email or app wording follows the factor                                                                                                                                                     | `forced` and `type` are separate fields, so half of mandated accounts were sent to an empty inbox                                                                                                                          |
| Setup requests time out after 30 seconds                          | The dashboard and account setup queries                              | No request carries a timeout, so a server that accepts a connection and never replies holds the loading overlay until the browser gives up | The setup queries abandon a request after 30s and land on the failure card                                                                                                                                                       | A hung request left the app on a spinner with no message, no status and no retry                                                                                                                                           |
| Loading screen says when a wait runs long                         | The boot overlay and every route's pending screen                    | The loading screen shows an illustration and a bar, and says nothing however long it runs                                                  | After ten seconds it adds a line, changing at 25s and 40s: "Still getting everything on your dashboard ready...", "Almost there, thanks for bearing with us a moment...", "Hang tight, we are nearly finished getting you in..." | A bar that has been creeping for half a minute reads as broken. The lines reassure rather than explain, since the delay is not the reader's to fix                                                                         |
| Even margins on the side bar logo                                 | The dashboard side navigation                                        | `3em auto 1em` expanded, `0.5em auto 1em` collapsed                                                                                        | 14px above and below at either width                                                                                                                                                                                             | The logo read as sitting high in its band, and the two widths pushed the items down by different amounts                                                                                                                   |
| Buttons load in every variant                                     | Every `AkButton` with `loading`                                      | `loading` applies to `filled` only; on `outlined` and `text` it does nothing, not even disable the button                                  | Every variant shows the spinner, disables and sets `aria-busy`                                                                                                                                                                   | A flag that silently does nothing is a trap; the caller has no way to know the button never became busy                                                                                                                    |
| A loading button keeps its right icon                             | Every `AkButton` with `rightIcon`                                    | The spinner replaces the left icon and the right icon is hidden                                                                            | The spinner replaces the left icon; the right icon stays                                                                                                                                                                         | The row's width jumps when the trailing mark disappears mid-action                                                                                                                                                         |
| Chips sit closer to their icon                                    | Every `AkChip` with `icon`                                           | `0.5em` on the icon and on the label, so 7px between them                                                                                  | 2px between the icon and the label; the outer inset is unchanged                                                                                                                                                                 | The label read as detached from the mark it belongs to                                                                                                                                                                     |
| Reporting opens on its first page                                 | `/dashboard/reports`                                                 | An index route renders the reporting landing page                                                                                          | Redirects to `/dashboard/reports/generate`                                                                                                                                                                                       | Reporting's landing page is unbuilt, and the generate page is the only screen it offers                                                                                                                                    |
| Security dashboard has a side navigation                          | `/security/*`                                                        | A bar carrying three tabs, and no navigation beside the page                                                                               | The shared side navigation with its own three items, and the product switcher in it                                                                                                                                              | The product was the only one reached without the navigation every other product has, so leaving it put the switcher out of reach from inside it                                                                            |
| One navigation width for every product                            | Every product layout                                                 | Reporting stores `reportSidebarState`; every other product shares `sidebarState`, so reporting collapses on its own                        | One `irene:sidebar-state` for all of them, so collapsing in any product collapses them all                                                                                                                                       | The width is a reading preference, not a property of a product; irene's split means the same person sets it twice                                                                                                          |
| Offensive security spaces its navigation like every other product | `/dashboard/offensive-security`                                      | `@isOffsec` puts `offsec-sidenav` on the aside, which zeroes the item list's top margin                                                    | The same gap below the switcher that every other product's navigation has                                                                                                                                                        | The product has one item today; spacing it differently makes it read as a different navigation rather than the same one with less in it                                                                                    |
| The Jira Security install step is not offered                     | `/dashboard/organization/settings/integrations`, Jira Cloud Security | A first step links to the app's Jira marketplace listing, from `IRENE_JIRA_SECURITY_INSTALL_URL`                                           | The step is left out, and the remaining steps are numbered from one                                                                                                                                                              | No config key is registered for that URL here, and inventing one means a deployment change. irene drops the step the same way when the variable is unset, so this matches a real configuration until the key is registered |
| The service account list loads as a skeleton table                | `/dashboard/organization/settings/service-account`                   | An illustration with a spinner and "Loading..." below it                                                                                   | Rows shaped like the real ones, as every other table in this app loads                                                                                                                                                           | A placeholder shaped like the table keeps the header and the controls still while it loads, which an illustration of a different height does not                                                                           |
| The new account's secret is shown where it was made               | `/dashboard/organization/settings/service-account/create`            | Saving leaves for the account's own screen, which shows the secret once                                                                    | The create screen shows it in place, and offers the way on to the account                                                                                                                                                        | The secret is answered once and never again. Until the account's own screen is this app's, leaving the page would lose it for good                                                                                         |

## Accepted

Nothing yet. Move a row here with the date and who signed it off.

## Known gaps, not decisions

Nothing here is a deliberate departure. They are listed so QA does not raise
them: most are unbuilt work, and one is an inconsistency of irene's own that the
port carries.

| Gap                                                                  | Where                                                                            | Note                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LOGOUT_EVENT` is not tracked                                        | `useLogout`                                                                      | irene sends it to PostHog. Analytics is Week 5 work                                                                                                                                                                                                  |
| PostHog is not registered on boot                                    | `setupUserAndOrgContext`                                                         | The last of irene's seven ordered `afterModel()` steps; the other six are built                                                                                                                                                                      |
| Pendo is built but unverified                                        | `setupUserAndOrgContext`, `scripts/pendo.ts`, the side navigation                | Written against irene, never run against a live subscription. See below                                                                                                                                                                              |
| StoreKnox's product-guide container is unverified                    | `storeknox-layout`, `scripts/pendo.ts`                                           | The release row carries `sk-pendo-version-container` as irene does, but the guides are only drawn where Pendo is enabled, which no test can turn on                                                                                                  |
| No realtime server row                                               | `/dashboard/status`                                                              | irene shows a fourth row for the WebSocket while signed in; the socket is unbuilt                                                                                                                                                                    |
| Support address gated two ways                                       | `register-invitation-invalid`, the locked-account message, the page-failure card | irene uses two different rules and the port keeps each one where irene has it. See below                                                                                                                                                             |
| The notification list loads as a skeleton, not a spinner             | `notifications/components/loading-skeleton.tsx`                                  | irene centres an `AkLoader` in a 12.5em band. Ours stands in four rows shaped as the real ones, so the panel does not resize when they arrive                                                                                                        |
| The support widget renews its token for as long as the session lasts | `scripts/freshdesk.ts`                                                           | irene answers the widget's expiry callback with a token and no callback of its own, so the next expiry is never answered and support loses the account after four hours. Ours passes the callback each time                                          |
| Eight route shells exist only for notification links                 | `/dashboard/file/$fileId` and seven others                                       | irene's notification messages link into the file, analysis, dynamic-scan, SBOM, store-monitoring, StoreKnox inventory and project-settings pages. Each is a `RouteShell` so the links resolve and navigate; each is replaced as its page is migrated |
| The notifications page is a route shell                              | `/dashboard/notifications`                                                       | The dropdown's "View All Notifications" link needs a destination. The full page, its read/unread filter and its pagination are unbuilt                                                                                                               |
| Each notification checks its context before rendering                | `notifications/components/messages/*/context.ts`, `notification-map.tsx`         | irene reads the context straight off the model. Ours declares a zod schema per message, which the map parses before handing it over, so a payload that has drifted renders as its code rather than as a message with holes. See below                |
| Integration events are not tracked                                   | Every card under `settings/integrations`                                         | irene sends `INTEGRATION_INITIATED_EVENT` to PostHog as each connection starts. Analytics is unbuilt in this app                                                                                                                                     |
| Notification message layout is unverified against production         | `features/notifications/components/messages/`                                    | All 44 are ported from irene's templates and SCSS. Every one renders from a real payload, but only two have been compared against production for layout. See below                                                                                   |
| Six notification codes render as their code                          | `notifications/components/notification-map.tsx`                                  | mycroft sends `NF_AUTOPILOT_DAST_ERRORED` and five StoreKnox app-request codes that irene has no template for either. They fall through to the error message, which names the code. Resolved when the product decides whether they should appear     |
| StoreKnox and offensive security render in the dashboard layout      | `/dashboard/storeknox/…`, `/dashboard/offensive-security`                        | irene gives each product its own wrapper, navigation and title. Ours are route shells nested under the dashboard layout, so they carry its navigation and read as `… \| VAPT \| Appknox`. Resolved when each gets a layout, as reporting now has     |

### The two support-address rules

irene decides whether to link `support@appknox.com` in two different ways, and
the port follows irene screen by screen:

- The invalid-invitation screen reads `whitelabel.isEnabled()`, the
  `WHITELABEL_ENABLED` build flag (`register-oidc-error/index.ts:20`).
- The locked-account message and the page-failure card read
  `whitelabel.is_appknox_url`, the host
  (`user-login/via-username-password/index.ts:29`, `perform-mfa/index.ts:40`).

Both rules give the right answer in production: an Appknox deployment links the
address, a whitelabel one does not. They only disagree on localhost and staging,
where the build flag is unset but the host is not `secure.appknox.com` — so the
invitation screen links the address and the other two print it as plain text.

### Notification message templates need a second pass

The 44 message components, the dropdown and the message row are ported from
irene's `notifications-page` and `notifications-dropdown` templates and their
SCSS, value by value: the stack spacings, the type scale, the weights and the
colours all resolve to the same pixels and hex codes irene renders.

Every one of the 44 has been rendered from a real payload: each event was fired
on a local mycroft, read back through `GET /api/v2/nf_in_app_notifications` and
run through its own schema. What that does not cover is layout — only the
dropdown list and the SBOM message have been compared against production for
spacing, weight and colour, so the port is still only as good as the reading of
each template. Four things are worth looking at first when someone does compare
them:

- **The risk-status card.** irene lays the six severities out with
  `grid-template-rows: 1fr 1fr 1fr` and `grid-auto-flow: column`, so they fill
  down the left column before the right: Critical, High, Medium, then Low,
  Passed, Untested. A row-first grid reads plausibly and is wrong, which is how
  it was built the first time.
- **The namespace approval block.** The request and the approve and reject
  buttons share one bordered box; the links sit outside it. The standing comes
  from the namespace itself rather than the notification, and a namespace that
  404s counts as rejected, because rejecting removes it.
- **The per-message spacing.** irene's spacing utilities and `AkStack @spacing`
  both count in `0.5em` steps, so `pt-1` is 7px and `@spacing='2'` is 14px — not
  14px and 28px. Every gap in this module was wrong by a factor of two until
  that was traced.
- **Values the spacing scale cannot express.** The SBOM summary separates its
  counts by `1.25em`, which is 17.5px at a 14px root and needs a multiplier of
  4.375. Tailwind takes at most two decimal places, so the class generated no
  CSS and the counts ran together. It is rounded to the nearest step the scale
  has. A gap, padding or margin needing three decimals has to be rounded the
  same way — the class will not fail, it will silently do nothing.

What is deliberately not ported: the messages' deep links point at route shells
rather than real pages, and the notifications page itself is a shell, both
listed above.

### Pendo is written but has never run

The agent, the account it identifies and the badge the navigation carries are
all ported from irene: `installProductGuides` loads the agent behind a queueing
stub, `identifyForProductGuides` names the visitor by user id and the account by
email domain, and the release row in the navigation carries
`ak-pendo-version-container` and opens the guide the badge stands for. All of it
is off unless `IRENE_ENABLE_PENDO` is set, which is how irene gates it too.

None of it has been seen working. Switching it on locally never reached a guide
or the Visual Design Studio, and the attempt turned up two things to settle
before anyone calls this done:

- **Local configuration does not reach the app in dev.** `IRENE_*` keys are
  frozen into the bundle by Vite's `define`, and the dev server does not
  substitute `__BUILD_CONFIG__` in `@irene/config` — so every key falls back to
  its default however the environment is set, and no plugin can be switched on
  from a developer's machine. A deployment is unaffected: it injects
  `runtimeconfig.js`, which wins over the build tier.
- **Nothing is known about the subscription.** The agent key is irene's
  production one, hardcoded as irene hardcodes it. Pendo recommends a separate
  key and prefixed visitor ids for non-production, and the designer only opens
  on a host the subscription allows.

Revisit when the app is served somewhere Pendo accepts: confirm the agent
loads, that `pendo.validateInstall()` answers, that the release row opens a
badge guide, and decide whether a non-production key belongs in
`integrations.pendo_key` — the installer already prefers it over the built-in
one.

### Service account's three URLs cost a document load between them

The list lives in the organization settings tab, while create and an account's
own page are routes of their own. Ember owns the transition between them, so a
link that only changed the address client-side left the settings chrome — the
organization header and the tab row — drawn around the create and details
screens, and put a second breadcrumb trail under Ember's own. Create, View
Details, Duplicate, Cancel and every breadcrumb therefore hand the address to
the browser, which is the transition irene itself makes.

This goes away on its own: once every organization settings tab is React's and
`organization-settings.hbs` mounts the whole screen, the three URLs sit inside
one React router and the links go back to `Link`. Until then the reload is what
keeps the layout correct, and it is not a regression against irene.

### The settings screen's own date picker

The organization's data exports are asked for over a span of days, which irene
picks with `AkDatePicker` — a range calendar with the common spans down one
side. The design system had no such component and the repo had no date picker
dependency, so `AkDatePicker` is built here from `dayjs`, which `@irene/ui` now
depends on: a month grid, a range chosen in two presses, and irene's own five
spans (`last7Days`, `last30Days`, `last3Months`, `last6Months`, `lastYear`),
each read when it is chosen rather than when the module loads.

It is deliberately smaller than irene's, which also serves single and multiple
selection and takes custom spans. Those are added when a screen needs them.

### Keys irene leaves to a hardcoded string

Five pieces of text on this screen are not translated upstream, so they are
keys here rather than literals, with irene's exact English:

- `addEmailDomains` — irene writes "Add email domains" into the template.
- `automatic` — irene renders `t(type.toLowerCase())` for a cleanup's type, and
  only `manual` exists, so a scheduled cleanup shows the key itself.
- `fileCleanup.filesToKeepError` — irene's changeset validator carries the
  message "Value must be between 2 and 50" in code.
- `cyod.registration.addDeviceHint` and `addDeviceHintEnd` — present in irene's
  own translations but missing from this repo's bundle, so they are added.

### The signing certificate panel covers the organization alone

irene's `Organization::SigningCertificate` serves two scopes: an organization's
certificates, and a single project's own certificate that overrides them. The
settings screen only ever renders the first, so only that half is ported —
there is no project in scope here to override anything. The project half comes
with the project settings page.

### One router over the whole organization area

Every page under `/dashboard/organization` — the three organization panes, the
four settings tabs, and the two service account screens — is a route of a single
React screen, mounted by each of the Ember routes that serve those URLs. A
reader moving from namespaces to users to the settings to the integrations stays
in the browser the whole way: no document is fetched again.

What that costs is that Ember's own routing does not follow along. It stays on
whichever route the screen was mounted from, so the screen writes the address
bar and the browser tab's name itself, and a reload lands on the URL shown —
which Ember then matches, mounting the same screen at that page. The host's side
navigation keeps whichever entry it highlighted on arrival.

The earlier arrangement, a screen per host route, is what made crossing between
them a document load. That is gone; the service account screens and the settings
tabs link with `Link` again, and a breadcrumb follows the router unless the
ledger says the other app still serves that address.

### The report type column is drawn differently from irene's

irene writes the kind as a word and hides the span a comprehensive export
covers behind a calendar mark you have to hover. The span is the one thing that
tells two comprehensive exports apart, so it is written out: the kind read
plainly, the span after it in the quieter type, one line, with the year said
once where both ends share it. Asked for deliberately; it is the only place on
this screen that departs from irene's own layout.

### One loader per screen

A screen shows a single stand-in and then its content. Nothing is drawn section
by section as each answer arrives: the settings screen asks for every answer its
sections need (`use-settings-ready.ts`), including the first page of each of its
tables, and holds its own skeleton until all of them are in. The sections then
ask for the same answers and the cache has them, so nothing is fetched twice and
nothing fills itself in after the screen has been drawn.

A table's later pages are the exception, and not a loader on arrival: by then
the reader has the screen and is paging through it.
