# QA scenarios

Everything built and verified since the React migration started, by screen.
Updated at the end of each milestone.

Some states are hard to produce against a real backend (a held request, a 429, a
spent invitation). Those are exercised with MSW scenarios named in the URL —
`?mock=oidc:consent`. They run in development only, answer nothing but the
endpoints the scenario names, and leave everything else to the real API. They
are added while a milestone is tested and removed once it is signed off, so ask
for the ones a table names to be restored when you need them.

## Login

| Scenario                      | How to get there                                                  | Expected                                                           |
| ----------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| Sign in with a password       | `/login`, valid credentials                                       | Lands on the dashboard at `/`                                      |
| Wrong password                | `/login`, wrong password                                          | Message under the password field                                   |
| Locked account                | `/login`, wrong password until the account locks                  | Message under the field, with a password reset link                |
| Rate limited                  | `/login`, repeated attempts                                       | Countdown notice, form disabled until it ends                      |
| Request never reaches the API | `/login` with the network off                                     | "Network error" notification                                       |
| Session expired               | `/login?sessionExpired=true`                                      | Alert above the form                                               |
| Deactivated account           | `/login?userInactive=true`                                        | Alert takes priority over the expiry one                           |
| Signed out from another tab   | `/login?unauthenticated=true`                                     | Alert above the form                                               |
| SSO only                      | `/login`, address on an organisation that allows nothing but SSO  | Password field hidden, SSO button submits                          |
| SAML sign-in                  | `/login`, SAML account, press the SSO button                      | Leaves for the provider, returns to `/saml2/redirect` and signs in |
| SAML refused                  | `/saml2/redirect?err=any`                                         | Back to `/login` with the provider's error                         |
| OIDC sign-in                  | `/login`, OIDC account, press the SSO button                      | Same, returning to `/sso/oidc/redirect?code=…&state=…`             |
| OIDC refused                  | `/sso/oidc/redirect?error=access_denied`                          | Back to `/login` with the provider's error                         |
| Registration link             | `/login` on a deployment whose configuration enables registration | Footer offers "Register today"                                     |
| Deep link while signed out    | Open any `/dashboard/…` URL signed out                            | `/login?unauthenticated=true&redirectTo=…`, returns there after    |

## Two-factor

Reached from `/login` once the password step passes; there is no URL of its own.

| Scenario           | How to get there                                 | Expected                                    |
| ------------------ | ------------------------------------------------ | ------------------------------------------- |
| Authenticator code | `/login` with an account holding an app factor   | Code step replaces the password step        |
| Emailed code       | `/login` with an account holding an email factor | Same, worded for email                      |
| Mandatory 2FA      | `/login` on an organisation that mandates it     | Notice says so rather than looking optional |
| Optional 2FA       | `/login` with a user who chose it themselves     | No mandate notice                           |
| Wrong code         | Submit a bad code                                | Message on the code field                   |
| Too many codes     | Submit bad codes until it locks                  | Password reset offered                      |

## Session

| Scenario                  | How to get there                          | Expected                                              |
| ------------------------- | ----------------------------------------- | ----------------------------------------------------- |
| Restore a session         | Reload `/` while signed in                | Stays signed in, one check per load                   |
| Credential refused        | Clear the token in DevTools, reload `/`   | Stored session cleared, back to `/login`              |
| Sign out                  | `/`, press Logout                         | Session cleared, lands on `/login`                    |
| Sign out in another tab   | Open `/` twice, log out in one            | The other tab follows to `/login`                     |
| Sign in in another tab    | Open `/login` twice, sign in in one       | The other tab follows into the dashboard              |
| Second sign-in in one tab | `/login`, sign in, log out, sign in again | Loading screen appears again, not just the first time |

## Forgotten password

| Scenario                | How to get there                                    | Expected                                            |
| ----------------------- | --------------------------------------------------- | --------------------------------------------------- |
| Request a link          | `/recover`                                          | Same confirmation whether or not the account exists |
| Rate limited            | `/recover`, repeated requests                       | Countdown notice                                    |
| Open a valid link       | `/reset/<token>` from the email                     | Password form                                       |
| Spent or unknown link   | `/reset/not-a-real-token`                           | "Invalid link" message, no form                     |
| Link check fails        | `/reset/<token>` while the check answers 500 or 429 | Message with a retry button                         |
| Mismatched confirmation | `/reset/<token>`, two different passwords           | Message under the confirmation, no API call         |
| Password rejected       | `/reset/<token>`, a password the API refuses        | Message under the password field                    |
| Reset succeeds          | `/reset/<token>`, a valid password                  | Back to `/login` with a confirmation                |

## Registration

| Scenario                      | How to get there                                                 | Expected                                                   |
| ----------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------- |
| Register                      | `/register`                                                      | "Registration has been initiated." and check-your-email    |
| Address already registered    | `/register` with an address that already has an account          | Identical screen — never reveals who has an account        |
| Invalid address or company    | `/register` with values the API refuses                          | Message under the field named by the API                   |
| reCAPTCHA refused             | `/register` from an IP scoring low                               | Notification with the API's message, form keeps its values |
| Registration switched off     | `/register` on a deployment that disables it                     | Generic "Something went wrong" notification                |
| Server error                  | `/register` while the API answers 500                            | Same notification                                          |
| Rate limited                  | `/register`, repeated attempts                                   | Countdown notice                                           |
| Slow response                 | `/register` with the request held                                | Submit button holds its loading state                      |
| Registration hosted elsewhere | `/register` on a deployment with an external `registration_link` | Leaves for that URL                                        |
| Registration disabled         | `/login` on a deployment with no link and registration off       | Login card shows no footer                                 |

reCAPTCHA is never mocked: the widget loads from recaptcha.net and issues a real
token; only the request carrying it is answered by a scenario.

## Invite registration

| Scenario                        | How to get there                                                      | Expected                                                               |
| ------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Redeem an invitation            | `/register-via-invite/<token>` from the email                         | Email and company prefilled and read-only, submit signs the account in |
| Invitation loading              | `/register-via-invite/<token>` with the read held                     | Skeleton in the form's shape                                           |
| Link no longer valid            | `/register-via-invite/not-a-real-token`                               | Illustration, "Something went wrong", support link, no form            |
| Support link on an Appknox host | The invalid link above on an Appknox-hosted deployment                | Support word links to support@appknox.com                              |
| Support link, whitelabelled     | The invalid link above on a whitelabelled deployment                  | Support word is plain text                                             |
| Username taken                  | `/register-via-invite/<token>` with an existing username              | Message under the username field                                       |
| Password rejected               | `/register-via-invite/<token>` with a short or common password        | Message under the password field                                       |
| Confirmation mismatch           | `/register-via-invite/<token>`, two different passwords               | Message under the confirmation                                         |
| Terms not accepted              | `/register-via-invite/<token>`, box left unticked                     | Message under the checkbox                                             |
| Link spent while filling in     | Redeem the token elsewhere, then submit the open form                 | Generic notification                                                   |
| Client-side rules               | `/register-via-invite/<token>`, username under 3 or password under 10 | Message appears on submit, clears as the field is corrected            |

## OIDC authorization

Appknox acting as the identity provider. Every row below is a URL to paste into
the address bar while signed in — no token to mint, any `oidc_token` value works
under a mock. The client's callback is `https://example.com/callback`, which is
a placeholder page: read its query string, not its contents.

The one row without a mock is the live flow against the local backend, which
needs a real token.

| Scenario                  | How to get there                                                                         | Expected                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Token being checked       | `/dashboard/oidc/redirect?oidc_token=mock&mock=oidc:validating`                          | Spinner on the redirect page, nothing else                                      |
| Spent or unknown token    | `/dashboard/oidc/redirect?oidc_token=mock&mock=oidc:invalid-token`                       | Error state: illustration, "Invalid OIDC Token", Dashboard Home and Login again |
| Refusal with no wording   | `/dashboard/oidc/redirect?oidc_token=mock&mock=oidc:refused-without-reason`              | Same, headed "Something went wrong"                                             |
| Refusal owned by a client | `/dashboard/oidc/redirect?oidc_token=mock&mock=oidc:refused-to-client`                   | Leaves for the callback with `error=invalid_scope`, error state never shown     |
| Consent screen            | `/dashboard/oidc/redirect?oidc_token=mock&mock=oidc:consent`                             | Three scopes, Cancel and Authorize side by side under a divider                 |
| Authorize                 | Open `oidc:consent`, press Authorize                                                     | Leaves for the callback with `code` and `state=xyz`                             |
| Cancel                    | Open `oidc:consent`, press Cancel                                                        | Same callback with `error=access_denied` and `state=xyz`                        |
| One scope                 | `/dashboard/oidc/redirect?oidc_token=mock&mock=oidc:consent-single-scope`                | List holds one row                                                              |
| Long name, many scopes    | `/dashboard/oidc/redirect?oidc_token=mock&mock=oidc:consent-overflowing`                 | Card holds a six-row list and a wrapping heading without overflow               |
| Consent request in flight | `/dashboard/oidc/redirect?oidc_token=mock&mock=oidc:consent-loading`                     | Spinner, no consent card                                                        |
| Already granted           | `/dashboard/oidc/redirect?oidc_token=mock&mock=oidc:already-granted`                     | Nothing asked, leaves for the callback with a code straight away                |
| Consent request refused   | `/dashboard/oidc/redirect?oidc_token=mock&mock=oidc:consent-refused`                     | Error state                                                                     |
| Decision fails            | Open `oidc:decision-fails`, press Authorize                                              | Toast reads "The request could not be completed", card stays                    |
| Decision in flight        | Open `oidc:deciding`, press Authorize                                                    | Authorize spins, Cancel disabled, nothing navigates                             |
| Dashboard Home            | Open any error state, press Dashboard Home                                               | Lands on `/`; browser back does not return to the spent token                   |
| Login again               | Open any error state, press Login again                                                  | Signs out and lands on `/login`                                                 |
| Signed out on arrival     | Log out, then open any row above                                                         | Login page, then back to the same URL with its token intact after signing in    |
| Live flow, no mock        | `GET api/v2/oidc/authorize/` with a registered `client_id`, follow the redirect it gives | Full flow against the local backend; the token is single use and lasts 300s     |

The error state's signed-out wording is not reachable through the routes: the
`_authenticated` guard catches a missing session first. It covers a session that
dies between the guard and the token check.

## App boot and route failures

| Scenario                  | How to get there                                             | Expected                                                     |
| ------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Cold boot with a session  | Reload `/` while signed in                                   | Loading screen covers the app, its bar advances to the end   |
| Configuration in flight   | Reload `/login` with `api/v2/frontend_configuration` held    | Logo and footer hold their space for 15 seconds, then render |
| Signed-in setup in flight | Reload `/` with `api/organizations` held                     | Loading screen stays up                                      |
| Setup fails               | Reload `/` while `api/organizations` answers 500             | Failure card: retry, email support, log out                  |
| Retry succeeds            | From that card, restore the API and press Retry              | Page renders                                                 |
| Retry fails again         | From that card, press Retry while it still fails             | Failure card stays, no duplicate messages                    |
| Unknown URL               | `/not-a-real-page`                                           | "Page not found", with the line on why it may be missing     |
| Page navigation           | Move between `/` and `/dashboard/oidc/redirect?oidc_token=x` | Thin progress bar at the top, no full-screen cover           |

## Home

Reached at `/dashboard/home`. Every scenario here signs itself in, so no login
step is needed — open the URL as it is written.

The product names follow the host: anything but an Appknox host is somebody
else's brand, so the first two cards are named after what they do. Open
`http://secure.appknox.com.localhost:4200/…` to see the Appknox names, and
`http://localhost:4200/…` to see the whitelabel ones.

| Scenario            | How to get there                                    | Expected                                                             |
| ------------------- | --------------------------------------------------- | -------------------------------------------------------------------- |
| Every product       | `/dashboard/home?mock=home:all`                     | Five cards: VAPT, StoreKnox, offensive security, reporting, security |
| Appknox names       | The same URL on `secure.appknox.com.localhost:4200` | First two cards read Appknox and StoreKnox                           |
| Nothing to choose   | `/dashboard/home?mock=home:appknox-only`            | Redirected straight to `/dashboard/projects`, no card shown          |
| StoreKnox entitled  | `/dashboard/home?mock=home:storeknox`               | Two cards                                                            |
| Security permission | `/dashboard/home?mock=home:security`                | Two cards; the security one opens `/security/projects` in a new tab  |
| Self-hosted install | `/dashboard/home?mock=home:enterprise`              | Reporting is entitled but withheld — two cards                       |
| Whitelabel branding | `/dashboard/home?mock=home:whitelabel`              | The Sentinel logo above the heading                                  |
| Sign out            | Any of the above, press Logout                      | Session cleared, lands on `/login`                                   |
| Narrow window       | Any of the above, resize below the card row's width | Cards wrap, none stretches to fill the row                           |

## System status

Reached at `/dashboard/status`, outside both guards, so no session is needed.

| Scenario          | How to get there                                   | Expected                                                                |
| ----------------- | -------------------------------------------------- | ----------------------------------------------------------------------- |
| Everything up     | `/dashboard/status?mock=status:all-up`             | Three rows, all Operational                                             |
| Everything down   | `/dashboard/status?mock=status:all-down`           | All three Unavailable; storage carries the proxy hint                   |
| Object store down | `?mock=status:storage-down`                        | Storage Unavailable, the other two Operational                          |
| Device farm down  | `?mock=status:devicefarm-down`                     | Device farm Unavailable                                                 |
| API down          | `?mock=status:api-down`                            | API server Unavailable                                                  |
| Checks in flight  | `?mock=status:checking`                            | All three rows stay on Checking, then turn Operational after 15 seconds |
| Refocus           | `?mock=status:all-up`, leave the tab and come back | Every check runs again                                                  |
| Old address       | `/status`                                          | Replaced by `/dashboard/status`, no entry in the back stack             |
| Language          | Any of the above, switch below the card            | Systems, statuses and the heading follow                                |

## Mock scenarios

Every scenario below runs from the dev server with no backend. Name one in the
URL and open the page beside it. A scenario marked signed in writes its own
session, so no login step is needed; the rest clear whatever session is stored.

A scenario that holds a request open answers it after 15 seconds, so the screen
after the wait is reachable without a reload. Nothing is aborted: the request
stays in flight and is answered late, the way a slow server behaves. Add `&hold=`
to change that — `&hold=10` waits ten seconds and `&hold=forever` never answers.
`forever` is not forever on the dashboard and account setup endpoints: those
requests are abandoned after 30 seconds and land on the failure card. Everywhere
else the page waits for as long as the tab is open.

Where the product names matter, open the same URL on
`http://secure.appknox.com.localhost:4200` for the Appknox names and on
`http://localhost:4200` for the whitelabel ones.

| Scenario                    | Open                                                          | Expected                                                                            |
| --------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `home:all`                  | `/dashboard/home?mock=home:all`                               | Five cards: VAPT, StoreKnox, offensive security, reporting, security                |
| `home:appknox-only`         | `/dashboard/home?mock=home:appknox-only`                      | Redirected to `/dashboard/projects`, no card shown                                  |
| `home:storeknox`            | `/dashboard/home?mock=home:storeknox`                         | Two cards                                                                           |
| `home:security`             | `/dashboard/home?mock=home:security`                          | Two cards; the security one opens `/security/projects` in a new tab                 |
| `home:enterprise`           | `/dashboard/home?mock=home:enterprise`                        | Reporting is entitled but withheld — two cards                                      |
| `home:whitelabel`           | `/dashboard/home?mock=home:whitelabel`                        | The Sentinel logo above the heading                                                 |
| `status:all-up`             | `/dashboard/status?mock=status:all-up`                        | Three rows, all Operational                                                         |
| `status:all-down`           | `/dashboard/status?mock=status:all-down`                      | All three Unavailable; storage carries the proxy hint                               |
| `status:storage-down`       | `/dashboard/status?mock=status:storage-down`                  | Storage Unavailable, the other two Operational                                      |
| `status:devicefarm-down`    | `/dashboard/status?mock=status:devicefarm-down`               | Device farm Unavailable                                                             |
| `status:api-down`           | `/dashboard/status?mock=status:api-down`                      | API server Unavailable                                                              |
| `status:checking`           | `/dashboard/status?mock=status:checking`                      | All three rows stay on Checking                                                     |
| `login:success`             | `/login?mock=login:success`                                   | Any password signs in and lands on the dashboard                                    |
| `login:wrong-password`      | `/login?mock=login:wrong-password`                            | Both fields marked, message under the password                                      |
| `login:locked`              | `/login?mock=login:locked`                                    | Locked message, password reset offered in place of the button                       |
| `login:server-error`        | `/login?mock=login:server-error`                              | Notification carrying the server's message                                          |
| `login:rate-limited`        | `/login?mock=login:rate-limited`                              | 30-second countdown, no password error beside it                                    |
| `login:sso-optional`        | `/login?mock=login:sso-optional`                              | Password field and SSO button together                                              |
| `login:sso-only`            | `/login?mock=login:sso-only`                                  | No password field; the SSO button submits                                           |
| `login:mfa-app`             | `/login?mock=login:mfa-app`                                   | Authenticator code step — `123456` passes, anything else is refused                 |
| `login:mfa-email`           | `/login?mock=login:mfa-email`                                 | Same, worded for email                                                              |
| `login:mfa-mandatory`       | `/login?mock=login:mfa-mandatory`                             | Same, with the notice that the organization mandates it                             |
| `login:mfa-mandatory-email` | `/login?mock=login:mfa-mandatory-email`                       | Same, worded for email                                                              |
| `login:check-held`          | `/login?mock=login:check-held`                                | The username step keeps its spinner for 15 seconds, then moves on                   |
| `recover:sent`              | `/recover?mock=recover:sent`                                  | Confirmation telling the user to read their email                                   |
| `recover:unknown-account`   | `/recover?mock=recover:unknown-account`                       | The same check-your-email confirmation, which never says who has an account         |
| `recover:server-error`      | `/recover?mock=recover:server-error`                          | Notification, and the form keeps what was typed                                     |
| `recover:rate-limited`      | `/recover?mock=recover:rate-limited`                          | 30-second countdown, nothing else                                                   |
| `reset:valid-link`          | `/reset/mock-reset-token?mock=reset:valid-link`               | Password form; a valid password returns to `/login`                                 |
| `reset:spent-link`          | `/reset/anything?mock=reset:spent-link`                       | Invalid-link message, no form                                                       |
| `reset:check-fails`         | `/reset/anything?mock=reset:check-fails`                      | Server-error message with an enabled Retry                                          |
| `reset:check-held`          | `/reset/anything?mock=reset:check-held`                       | The form holds its shape for 15 seconds, then renders                               |
| `reset:password-refused`    | `/reset/mock-reset-token?mock=reset:password-refused`         | Message under the password field                                                    |
| `register:accepted`         | `/register?mock=register:accepted`                            | "Registration has been initiated." and check-your-email                             |
| `register:field-refused`    | `/register?mock=register:field-refused`                       | Message under the company field                                                     |
| `register:disabled`         | `/register?mock=register:disabled`                            | Generic notification                                                                |
| `register:elsewhere`        | `/register?mock=register:elsewhere`                           | Leaves for the registration link the configuration names                            |
| `invite:open`               | `/register-via-invite/mock-token?mock=invite:open`            | Email and company read-only, name prefilled                                         |
| `invite:no-company`         | `/register-via-invite/mock-token?mock=invite:no-company`      | Company field editable                                                              |
| `invite:spent`              | `/register-via-invite/mock-token?mock=invite:spent`           | Invalid-invitation state                                                            |
| `orginvite:open`            | `/invite/mock-invitation-token?mock=orginvite:open`           | Read-only email and organization; accepting asks the user to sign in                |
| `orginvite:sso`             | `/invite/mock-invitation-token?mock=orginvite:sso`            | No password fields                                                                  |
| `orginvite:username-taken`  | `/invite/mock-invitation-token?mock=orginvite:username-taken` | Message under the username field                                                    |
| `orginvite:spent`           | `/invite/anything?mock=orginvite:spent`                       | Invalid-invitation state                                                            |
| `boot:setup-fails`          | `/?mock=boot:setup-fails`                                     | Failure screen naming Error 500, with a support mailto carrying it                  |
| `boot:setup-unreachable`    | `/?mock=boot:setup-unreachable`                               | Failure screen with no status named                                                 |
| `boot:retry-succeeds`       | `/?mock=boot:retry-succeeds`                                  | Failure screen; Retry loads the page                                                |
| `boot:setup-held`           | `/?mock=boot:setup-held`                                      | Loading overlay stays up for 15 seconds, its bar advancing, then the page renders   |
| `boot:setup-timeout`        | `/?mock=boot:setup-timeout`                                   | Overlay for 30 seconds, then the failure card with no status, and no second attempt |
| `boot:wait-messages`        | `/?mock=boot:wait-messages`                                   | Overlay for 28 seconds: the waiting message at 10s, the next at 25s, then the page  |
| `boot:slow-page`            | `/dashboard/status?mock=boot:slow-page`                       | Progress bar at the top for three seconds                                           |
| `boot:session-expired`      | `/?mock=boot:session-expired`                                 | Session cleared, back to `/login` with the expiry alert                             |
| `boot:config-held`          | `/login?mock=boot:config-held`                                | Logo and footer hold their space                                                    |
| `boot:whitelabel-failure`   | `/?mock=boot:whitelabel-failure`                              | Failure screen with no Appknox support address                                      |

The not-found page needs no scenario: open `/not-a-real-page`. `/status` should
replace itself with `/dashboard/status`.

## Language and branding

| Scenario               | How to get there                                    | Expected                                      |
| ---------------------- | --------------------------------------------------- | --------------------------------------------- |
| Switch language        | `/login`, selector below the card                   | Page, labels and tab title follow immediately |
| Language persists      | Switch on `/login`, then reload                     | Same language after the reload                |
| Account language       | `/login`, sign in with a Japanese account           | Dashboard opens in Japanese                   |
| Whitelabel branding    | `/login` on a deployment with its own configuration | Its name, logo, favicon and colours           |
| No branding configured | `/login` on a plain deployment                      | Appknox name and logo                         |
