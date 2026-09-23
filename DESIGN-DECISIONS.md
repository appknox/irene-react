# Design decisions

Where the React app deliberately differs from irene, and why. Everything here
needs a product or design sign-off, because QA compares screens against irene
and an unlisted difference reads as a defect.

Anything not listed is a faithful port. Add a row when a difference is
introduced, not when it is noticed.

## Awaiting sign-off

| Change                                          | Where                                                   | irene today                                                                       | React now                                                                         | Why                                                                                        |
| ----------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Reveal control on password fields               | Every `AkInput` with `type="password"`                  | No reveal control on any password field                                           | An eye button inside the field toggles between hidden and visible                 | A 10-character minimum and a confirmation field is where typos go unnoticed                |
| Actions on the OIDC error state                 | `/dashboard/oidc/redirect`, `/dashboard/oidc/authorize` | Illustration, message, no controls                                                | "Dashboard Home" and "Login again" buttons, worded for whether a session exists   | The screen was a dead end; the only recovery is the client restarting, or signing in again |
| Post-login return path                          | `/login`                                                | The blocked URL is stashed in `sessionStorage` as `_lastTransitionInfo`           | The blocked URL rides on the URL as `?redirectTo=`, validated as an internal path | A typed, validated value that cannot leak into an unrelated later session                  |
| Name fields required on the organization invite | `/invite/:token`                                        | First and last name are not validated client-side, and the API refuses them empty | Both are required before the request is made                                      | The server already requires them, so the old behaviour spent a round trip to say so        |

## Accepted

Nothing yet. Move a row here with the date and who signed it off.

## Known gaps, not decisions

These are unfinished rather than deliberate. They are listed so QA does not
raise them as differences.

| Gap                 | Where             | Note                                                                |
| ------------------- | ----------------- | ------------------------------------------------------------------- |
| Not-found page      | Any unmatched URL | Renders an untranslated placeholder; not designed yet               |
| `/invitation/:uuid` | Not implemented   | irene declares the route with no route file, template or controller |
