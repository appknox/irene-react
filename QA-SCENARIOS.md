# QA scenarios

Every state we have built and exercised with mocked API responses, so QA can
reproduce them without waiting for the backend to produce each one.

Updated at the end of each milestone.

## How the mocks work

Scenarios run through [MSW](https://mswjs.io) in the browser, started from
`apps/dashboard/src/main.tsx` behind `import.meta.env.DEV` — they are never part
of a production build. A scenario is named in the URL:

```
/register-via-invite/any-token?mock=invite:username-taken
```

`?mock=` takes a comma-separated list. Each scenario also answers
`GET api/v2/frontend_configuration` and `GET api/v2/server_configuration`, so it
runs with no backend at all.

The harness is added when a milestone is being tested and removed once it is
signed off, to keep it out of the shipped bundle. To bring back the scenarios
below, restore `apps/dashboard/src/mocks/` and `public/mockServiceWorker.js` from
the commit named in each section, or ask for them to be re-added.

Status values: **Passed** — exercised in the browser against the mock;
**Untested** — implemented but not yet walked through.

## Milestone: app boot, route loading and failure

Removed after sign-off. Restore from `88bc923`.

| Scenario                  | Where              | What it stubs                             | Expected                                            | Status |
| ------------------------- | ------------------ | ----------------------------------------- | --------------------------------------------------- | ------ |
| Cold boot with a session  | `/`                | Holds `POST api/v1/check`                 | Boot overlay covers the app, its bar advances       | Passed |
| Configuration in flight   | `/`                | Holds `GET api/v2/frontend_configuration` | Boot overlay stays up while the branding loads      | Passed |
| Signed-in setup in flight | `/`                | Holds `GET api/organizations`             | Boot overlay covers the organization fetch          | Passed |
| Setup fails               | `/`                | 500 on `GET api/organizations`            | Failure card: retry, email support, logout          | Passed |
| Retry succeeds            | `/`                | 500 then 200 on `GET api/organizations`   | Retry rebuilds the route and the page renders       | Passed |
| Retry fails again         | `/`                | 500 on every attempt                      | Failure card stays, no duplicate messages           | Passed |
| Second sign-in in one tab | `/` → logout → `/` | Organization list held on the second pass | Boot overlay appears again, not just the first time | Passed |

## Milestone: registration

Removed after sign-off. Restore from `6e911e0`.

| Scenario                      | URL                                   | What it stubs                                       | Expected                                                     | Status |
| ----------------------------- | ------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------ | ------ |
| Registered                    | `/register?mock=register:success`     | 204 on `POST api/v2/registration`                   | Confirmation screen: "Registration has been initiated."      | Passed |
| Address already registered    | `?mock=register:existing`             | 204, as the API answers for a known address         | Identical screen — the page never reveals who has an account | Passed |
| Invalid address               | `?mock=register:invalid-email`        | 400 `{"email": [...]}`                              | Message under the email field                                | Passed |
| Invalid company               | `?mock=register:invalid-company`      | 400 `{"company": [...]}`                            | Message under the company field                              | Passed |
| reCAPTCHA refused             | `?mock=register:recaptcha-failed`     | 400 `{"recaptcha": [...]}`                          | Notification with the API's message, form keeps its values   | Passed |
| Registration switched off     | `?mock=register:disabled`             | 404 `{"detail": "Not found."}`                      | Generic "Something went wrong" notification                  | Passed |
| Server error                  | `?mock=register:server-error`         | 500                                                 | Same generic notification                                    | Passed |
| Throttled                     | `?mock=register:rate-limited`         | 429 with `lock_time: 30`                            | Countdown notice, nothing else talks over it                 | Passed |
| Slow response                 | `?mock=register:slow`                 | 204 after 3s                                        | Submit button holds its loading state                        | Passed |
| Registration hosted elsewhere | `?mock=config:registration-external`  | Configuration names an external `registration_link` | Route leaves the app for that URL                            | Passed |
| Registration disabled         | `/login?mock=config:registration-off` | `registration_enabled: false`, no link              | Login card shows no footer                                   | Passed |

reCAPTCHA is never stubbed: the widget loads from recaptcha.net and issues a
real token, and only the request carrying it is answered by the mock.

## Milestone: invite registration

Removed after sign-off. Restore from the commit that adds
`apps/dashboard/src/features/auth/pages/register-via-invite`.

All at `/register-via-invite/<any-token>?mock=<name>`.

| Scenario                    | Name                                 | What it stubs                                   | Expected                                                     | Status   |
| --------------------------- | ------------------------------------ | ----------------------------------------------- | ------------------------------------------------------------ | -------- |
| Invitation redeemed         | `invite:success`                     | 200 prefill, then `{token, user_id}`            | Form prefilled, submit signs the account in and lands on `/` | Passed   |
| Invitation loading          | `invite:slow`                        | Prefill after 3s                                | Form skeleton: heading, seven fields, terms row, button      | Passed   |
| Link no longer valid        | `invite:invalid-token`               | 400 `{"token": ["Invalid Token"]}` on the read  | Illustration, "Something went wrong", support link, no form  | Passed   |
| Support link, Appknox host  | `invite:invalid-token-on-appknox`    | As above, `isAppknoxUrl` true                   | Support word renders in the Appknox-hosted branch            | Untested |
| Support link, whitelabelled | `invite:invalid-token-whitelabelled` | As above, `isAppknoxUrl` false                  | Support word renders in the whitelabelled branch             | Untested |
| Username taken              | `invite:username-taken`              | 400 `{"username": ["Username already exists"]}` | Message under the username field                             | Passed   |
| Password rejected           | `invite:weak-password`               | 400 `{"password": [too short, too common]}`     | First message under the password field                       | Passed   |
| Confirmation mismatch       | `invite:password-mismatch`           | 400 `{"confirm_password": [...]}`               | Message under the confirmation field                         | Passed   |
| Terms refused by the API    | `invite:terms-refused`               | 400 `{"terms_accepted": [...]}`                 | Message under the checkbox                                   | Passed   |
| Link spent while filling in | `invite:token-spent`                 | 400 `{"token": ["Invalid Token"]}` on submit    | Generic notification — no field owns that error              | Passed   |
| Server error                | `invite:server-error`                | 500                                             | Same generic notification                                    | Passed   |

Worth walking through on any of these, without a mock: username under three
characters, password under ten, mismatched confirmation, unticked terms. Each
message clears as the field is corrected, since the form revalidates on change.

## Backend responses these mirror

Confirmed by calling mycroft directly rather than reading its code.

| Endpoint                              | Case                                  | Response                                                                  |
| ------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------- |
| `POST api/v2/registration`            | New address, known address, repeat    | 204, no body — identical in all three                                     |
|                                       | Invalid or blank email                | 400 `{"email": ["Enter a valid email address."]}`                         |
|                                       | Missing recaptcha                     | 400 `{"recaptcha": ["This field is required."]}`                          |
|                                       | Registration disabled                 | 404 `{"detail": "Not found."}`                                            |
|                                       | company, first_name, last_name        | Optional server-side; the form requires a company                         |
| `GET api/v2/registration-via-invite`  | Valid token                           | 200 `{email, company, first_name, last_name}`                             |
|                                       | Unknown, garbled, expired or redeemed | 400 `{"token": ["Invalid Token"]}`                                        |
|                                       | No token                              | 400 `{"token": ["This field is required."]}`                              |
| `POST api/v2/registration-via-invite` | Valid                                 | 200 `{token, user_id}` — the account is signed in at once                 |
|                                       | Username under 3, non-ASCII, or taken | 400 `{"username": [...]}`                                                 |
|                                       | Password below Django's rules         | 400 `{"password": [one or more messages]}`                                |
|                                       | Confirmation mismatch                 | 400 `{"confirm_password": ["Password and Confirm Password don't match"]}` |
|                                       | Terms not accepted                    | 400 `{"terms_accepted": ["Please accept terms & conditions to proceed"]}` |
