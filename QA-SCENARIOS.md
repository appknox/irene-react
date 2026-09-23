# QA scenarios

Everything built and verified since the React migration started, by screen.
Updated at the end of each milestone.

Some states are hard to produce against a real backend (a held request, a 429, a
spent invitation). Those were exercised with MSW scenarios named in the URL —
`?mock=register:rate-limited` — which are added while a milestone is tested and
removed once it is signed off. Ask for them to be restored when you need them.

## Login

| Scenario                      | How to get there                    | Expected                                                           |
| ----------------------------- | ----------------------------------- | ------------------------------------------------------------------ |
| Sign in with a password       | `/login`                            | Lands on the dashboard                                             |
| Wrong password                | Wrong credentials                   | Message under the password field                                   |
| Locked account                | Too many attempts                   | Message under the field, with a password reset link                |
| Rate limited                  | Repeated attempts                   | Countdown notice, form disabled until it ends                      |
| Request never reaches the API | Offline                             | "Network error" notification                                       |
| Session expired               | `/login?sessionExpired=true`        | Alert above the form                                               |
| Deactivated account           | `/login?userInactive=true`          | Alert takes priority over the expiry one                           |
| Signed out from another tab   | `/login?unauthenticated=true`       | Alert above the form                                               |
| SSO only                      | Organisation allows nothing but SSO | Password field hidden, SSO button submits                          |
| SAML sign-in                  | SSO account                         | Leaves for the provider, returns to `/saml2/redirect` and signs in |
| OIDC sign-in                  | SSO account on OIDC                 | Same, via `/sso/oidc/redirect`                                     |
| Registration link             | Configuration enables it            | Footer offers "Register today"                                     |

## Two-factor

| Scenario           | How to get there           | Expected                                    |
| ------------------ | -------------------------- | ------------------------------------------- |
| Authenticator code | Account with an app factor | Code step replaces the password step        |
| Emailed code       | Account with email factor  | Same, worded for email                      |
| Mandatory 2FA      | Organisation mandates it   | Notice says so rather than looking optional |
| Optional 2FA       | User chose it themselves   | No mandate notice                           |
| Wrong code         | Bad code                   | Message on the code field                   |
| Too many codes     | Repeated wrong codes       | Password reset offered                      |

## Session

| Scenario                  | How to get there                | Expected                                              |
| ------------------------- | ------------------------------- | ----------------------------------------------------- |
| Restore a session         | Reload while signed in          | Stays signed in, one check per load                   |
| Credential refused        | Token no longer valid           | Stored session cleared, back to login                 |
| Sign out                  | Logout                          | Session cleared, back to login                        |
| Sign out in another tab   | Clear the session elsewhere     | This tab follows to login                             |
| Sign in in another tab    | Sign in elsewhere               | This tab follows into the dashboard                   |
| Second sign-in in one tab | Sign in, log out, sign in again | Loading screen appears again, not just the first time |

## Forgotten password

| Scenario                | How to get there         | Expected                                            |
| ----------------------- | ------------------------ | --------------------------------------------------- |
| Request a link          | `/recover`               | Same confirmation whether or not the account exists |
| Rate limited            | Repeated requests        | Countdown notice                                    |
| Open a valid link       | `/reset/<token>`         | Password form                                       |
| Spent or unknown link   | Bad token                | "Invalid link" message, no form                     |
| Link check fails        | 500 or 429 on the check  | Message with a retry button                         |
| Mismatched confirmation | Two different passwords  | Message under the confirmation, no API call         |
| Password rejected       | Password the API refuses | Message under the password field                    |
| Reset succeeds          | Valid password           | Back to login with a confirmation                   |

## Registration

| Scenario                      | How to get there             | Expected                                                   |
| ----------------------------- | ---------------------------- | ---------------------------------------------------------- |
| Register                      | `/register`                  | "Registration has been initiated." and check-your-email    |
| Address already registered    | Known address                | Identical screen — never reveals who has an account        |
| Invalid address or company    | Bad values                   | Message under the field named by the API                   |
| reCAPTCHA refused             | Low score                    | Notification with the API's message, form keeps its values |
| Registration switched off     | Deployment disables it       | Generic "Something went wrong" notification                |
| Server error                  | 500                          | Same notification                                          |
| Rate limited                  | Repeated attempts            | Countdown notice                                           |
| Slow response                 | Held request                 | Submit button holds its loading state                      |
| Registration hosted elsewhere | External `registration_link` | `/register` leaves for that URL                            |
| Registration disabled         | No link, not enabled         | Login card shows no footer                                 |

reCAPTCHA is never mocked: the widget loads from recaptcha.net and issues a real
token; only the request carrying it is answered by a scenario.

## Invite registration

| Scenario                        | How to get there                    | Expected                                                               |
| ------------------------------- | ----------------------------------- | ---------------------------------------------------------------------- |
| Redeem an invitation            | `/register-via-invite/<token>`      | Email and company prefilled and read-only, submit signs the account in |
| Invitation loading              | Slow read                           | Skeleton in the form's shape                                           |
| Link no longer valid            | Spent, unknown or expired token     | Illustration, "Something went wrong", support link, no form            |
| Support link on an Appknox host | Appknox-hosted                      | Support word links to support@appknox.com                              |
| Support link, whitelabelled     | Whitelabelled deployment            | Support word is plain text                                             |
| Username taken                  | Existing username                   | Message under the username field                                       |
| Password rejected               | Short or common password            | Message under the password field                                       |
| Confirmation mismatch           | Two different passwords             | Message under the confirmation                                         |
| Terms not accepted              | Leave the box unticked              | Message under the checkbox                                             |
| Link spent while filling in     | Redeemed elsewhere first            | Generic notification                                                   |
| Client-side rules               | Username under 3, password under 10 | Message appears on submit, clears as the field is corrected            |

## App boot and route failures

| Scenario                  | How to get there              | Expected                                                   |
| ------------------------- | ----------------------------- | ---------------------------------------------------------- |
| Cold boot with a session  | Reload signed in              | Loading screen covers the app, its bar advances to the end |
| Configuration in flight   | Slow configuration            | Logo and footer hold their space until it arrives          |
| Signed-in setup in flight | Slow organization fetch       | Loading screen stays up                                    |
| Setup fails               | 500 on the organization fetch | Failure card: retry, email support, log out                |
| Retry succeeds            | Fix the API, press retry      | Page renders                                               |
| Retry fails again         | Still failing                 | Failure card stays, no duplicate messages                  |
| Page navigation           | Move between pages            | Thin progress bar at the top, no full-screen cover         |

## Language and branding

| Scenario               | How to get there                      | Expected                                      |
| ---------------------- | ------------------------------------- | --------------------------------------------- |
| Switch language        | Selector below the auth card          | Page, labels and tab title follow immediately |
| Language persists      | Switch, then reload                   | Same language after the reload                |
| Account language       | Sign in with a Japanese account       | Dashboard opens in Japanese                   |
| Whitelabel branding    | Deployment with its own configuration | Its name, logo, favicon and colours           |
| No branding configured | Plain deployment                      | Appknox name and logo                         |
