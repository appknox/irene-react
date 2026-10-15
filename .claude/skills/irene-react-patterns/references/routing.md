# Routing

TanStack Router, file-based, in `apps/dashboard/src/routes/`. `routeTree.gen.ts`
is generated on save; never edit it.

| File                                    | Meaning                                                |
| --------------------------------------- | ------------------------------------------------------ |
| `__root.tsx`                            | restores locale, checks session, starts config load    |
| `_authenticated.tsx`                    | guard (→ `/login?redirectTo=…`), then loads user + org |
| `_unauthenticated.tsx`                  | layout for login, register, reset                      |
| `_authenticated/dashboard/projects.tsx` | `/dashboard/projects`                                  |
| `_unauthenticated/reset/$token.tsx`     | `/reset/:token`                                        |

`_name` adds a layout or guard without a URL segment. New signed-in pages go
under `_authenticated/`. A page outside both guards (`/dashboard/status`) needs
a comment saying why.

## A route file is wiring only

```ts
export const Route = createFileRoute('/_unauthenticated/login')({
  staticData: { pageTitle: () => akMT('login') },
  validateSearch: z.object({
    sessionExpired: z.boolean().optional(),
    redirectTo: returnPathSchema,
  }),
  beforeLoad: async ({ context }) => {
    if (await context.queryClient.query(sessionCheckOptions())) {
      throw redirect({ to: '/' });
    }
  },
  component: LoginPage, // from features/
});
```

- **`pageTitle`**: always set it, as a function so it follows the locale.
  `RouterPageTitleContext<'/path/$p'>` types params.
- **`validateSearch`**: params are optional. Validate navigation targets
  (`returnPathSchema` blocks open redirects).
- **`beforeLoad`**: guards and redirects (`replace: true` when there should be
  no history entry). Its return value merges into child `context`.
- **`loader`** + `pendingComponent: RoutePending` + `errorComponent: RouteError`:
  for data needed before render. The component then reads the same query with
  `useQuery`.
- A guard needing data a parent _loader_ fills must await that setup itself.
  Loaders run after all guards; cached queries make the second call free
  (`dashboard/home.tsx`).
- Moved URL: keep the old file as a redirect-only route (`routes/status.tsx`).

## In components

- `<Link to>` and `useNavigate()` are type-checked against the tree.
- `getRouteApi('/_unauthenticated/login').useSearch()` reads another route's
  search params.
- Path unions come from `FileRouteTypes['to']`, never hand-written.

## New page

Add the route file (title + component) and the page in
`features/<f>/pages/<name>/` (named export). Add a loader and pending/error
components if needed, a nav entry in `layouts/*/nav-items`, and a
`renderAtRoute` test.
