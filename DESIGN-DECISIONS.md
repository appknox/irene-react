# Design decisions

Where the React app deliberately differs from irene, and why. Everything here
needs a product or design sign-off, because QA compares screens against irene
and an unlisted difference reads as a defect.

Anything not listed is a faithful port. Add a row when a difference is
introduced, not when it is noticed.

## Awaiting sign-off

| Change                                          | Where                                                   | irene today                                                                               | React now                                                                                  | Why                                                                                                                   |
| ----------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Reveal control on password fields               | Every `AkInput` with `type="password"`                  | No reveal control on any password field                                                   | An eye button inside the field toggles between hidden and visible                          | A 10-character minimum and a confirmation field is where typos go unnoticed                                           |
| Actions on the OIDC error state                 | `/dashboard/oidc/redirect`, `/dashboard/oidc/authorize` | Illustration, message, no controls                                                        | "Dashboard Home" and "Login again" buttons, worded for whether a session exists            | The screen was a dead end; the only recovery is the client restarting, or signing in again                            |
| Post-login return path                          | `/login`                                                | The blocked URL is stashed in `sessionStorage` as `_lastTransitionInfo`                   | The blocked URL rides on the URL as `?redirectTo=`, validated as an internal path          | A typed, validated value that cannot leak into an unrelated later session                                             |
| Name fields required on the organization invite | `/invite/:token`                                        | First and last name are not validated client-side, and the API refuses them empty         | Both are required before the request is made                                               | The server already requires them, so the old behaviour spent a round trip to say so                                   |
| Subtext on the not-found page                   | Any unmatched URL                                       | Heading and a home button only                                                            | A line under the heading saying the link may be broken or the page moved                   | A bare "cannot be found" leaves the reader unsure whether they mistyped or we broke it                                |
| Re-check on window focus                        | `/dashboard/status`                                     | Every system is checked once, in the component constructor, and never again               | Each check runs again when the window is focused                                           | Someone watching an outage leaves the tab open; the page was reporting what was true when they opened it              |
| Appknox mark sized as an icon                   | `/dashboard/home`                                       | The mark fills the logo slot, up to 225x100px                                             | 40x40px, the whitelabel logo keeps the 225x100px slot                                      | On an Appknox host the slot is fed the favicon, a square mark that reads as oversized at 100px                        |
| Outlined buttons carry the page background      | Every `AkButton` with `variant="outlined"`              | Transparent everywhere; only the home page's logout button is given the page background   | Every outlined button uses the background token, so it is opaque on a tinted section       | The one-off on the home page showed the rule; a transparent secondary button reads as part of whatever sits behind it |
| Not-allowed cursor on a disabled button         | Every `AkButton`                                        | `pointer-events: none`, so a disabled button shows whatever cursor the page behind it has | `cursor-not-allowed`, and the pointer suppression stays only where the button is an anchor | A disabled button that looks the same to the cursor reads as unresponsive rather than unavailable                     |
| Status on the page-failure card                 | Any route whose guards or loaders fail                  | No failure card: the error reaches Ember's own error route                                | "Error 500" under the hint, and in the support mail's subject                              | A user reporting a failure had nothing to quote, and support nothing to search for                                    |
| Fixed column widths on the status table         | `/dashboard/status`                                     | The table lays out automatically                                                          | System 45%, Status 55%                                                                     | The status column carries a hint under an unreachable system, so it needs the wider half                              |

## Accepted

Nothing yet. Move a row here with the date and who signed it off.

## Known gaps, not decisions

These are unfinished rather than deliberate. They are listed so QA does not
raise them as differences.

| Gap                                       | Where                         | Note                                                                                                                                                             |
| ----------------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LOGOUT_EVENT` on sign-out                | `useLogout`                   | irene tracks it in PostHog. Analytics is Week 5 bootstrap work, so the step is unbuilt                                                                           |
| Freshdesk sign-out                        | `useLogout`                   | irene logs the user out of the support widget and destroys it. Freshdesk itself is unbuilt                                                                       |
| PostHog registration on boot              | `setupUserAndOrgContext`      | The seventh of irene's seven ordered `afterModel()` steps; the other six are built                                                                               |
| Pendo, trial flag, socket                 | `setupUserAndOrgContext`      | Three more of those steps, all deferred to the Week 5 bootstrap work                                                                                             |
| Realtime server row on the status page    | `/dashboard/status`           | irene shows a fourth row for the WebSocket while signed in; the socket itself is unbuilt                                                                         |
| Whitelabel detection differs by component | `register-invitation-invalid` | It reads the build flag `WHITELABEL_ENABLED`; the failure card and the login refusal read the host, which is irene's own rule. The build flag is the odd one out |
