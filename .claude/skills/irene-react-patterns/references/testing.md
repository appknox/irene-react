# Tests

Vitest + Testing Library + MSW. Test files sit next to the code. Coverage must
be ≥90% on every column. See also `CLAUDE.md` → Tests.

```tsx
const RECOVER_URL = buildAPITestURL(AuthEndpoints.recover());

it('posts the username and shows the confirmation', async () => {
  let body: unknown;

  server.use(
    http.post(RECOVER_URL, async ({ request }) => {
      body = await request.json();
      return HttpResponse.json({});
    })
  );

  await renderAtRoute('/recover');
  await userEvent.type(screen.getByLabelText(akMT('usernameEmailIdTextLabel')), USERNAME);
  await userEvent.click(screen.getByRole('button', { name: akMT('resetPassword') }));

  expect(body).toEqual({ username: USERNAME });
});
```

- **Render helpers** (`tests/render.tsx`):
  - `renderAtRoute(path, { settle })` for pages: real guards, loaders and
    layouts. `settle: false` shows the pending state.
  - `renderWithRouterContext(ui)` for components containing `<Link>`.
  - `renderWithProviders(ui)` for everything else.
- **MSW** runs the real axios stack. Build URLs with
  `buildAPITestURL(XEndpoints.y())`. Use `HTTP_STATUS_CODES` for statuses (older
  tests' raw `204`/`500` are legacy). `tests/server.ts` already answers config,
  session and signed-in setup.
- Query elements by role, label or text, with `akMT` for copy; `data-test-*`
  only as a fallback. Test names state the behaviour.
- **Factories** (`tests/factories/`): `build<Thing>(overrides = {})` with
  faker. Pin only the fields the test is about, and assert against the built
  object, never literals.
- **Don't `vi.mock` modules the app imports.** With `isolate: false`, files
  share modules per worker, so the mock is silently ignored whenever another
  file loaded the page first, and the test becomes flaky. Fake at the
  boundary instead: MSW for HTTP; for globals and third-party scripts, set the
  global and fire the event the library waits for (`loadRecaptchaWidget` in
  the register test); `vi.spyOn(window, …)` for browser APIs; module state is
  reset in `tests/setup.ts`.
- Packages: `api` tests services against MSW, plus stores and transforms.
  `ui` gets `index.test.tsx` + a story per component.
