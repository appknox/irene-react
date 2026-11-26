# API, queries, mutations and state

Flow: **endpoints → service → query options → component**, one file per step.

## Endpoints, types, index (`packages/api/src/services/<domain>/`)

```ts
// endpoints.ts: path builders only; encode segments; `as const`
export const OrganizationEndpoints = {
  list: () => `${API_NAMESPACES.v1}/organizations` as const,
  me: (id: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(id)}/me` as const,
};

// index.ts: always this shape
export * from './endpoints';
export type * from './types';
export { default as OrganizationService } from './service';
```

- Namespaces: `v1` `api`, `v2` `api/v2`, `v3` `api/v3`, `hudson`
  `api/hudson-api`. Use the one irene used for that endpoint. Tests build MSW
  URLs from the same endpoints.
- `types.ts`: `Api*` interfaces with the server's snake_case fields, plus
  `Api<X>Request` and `Api<X>Response`.

## Service (`service.ts`)

A default-exported class of `public static readonly` arrow functions. Each one
calls `apiRequest.<verb><T>(url, …)`, which returns the **body**.

```ts
public static readonly getOrganizations = async () => {
  const page = await apiRequest.get<ApiPageEnvelope<ApiOrganization>>(
    OrganizationEndpoints.list(), { signal: AbortSignal.timeout(REQUEST_ABORT_TIMEOUT_MS) });

  return transformPaginatedResponse(page);
};
```

- **Lists**: `ApiPageEnvelope` → `transformPaginatedResponse` → `ApiPage<T>`
  (`items`, `count`, `hasNext`…). Components never read `results`.
- **JSON:API responses** (`data.attributes`, kebab-case) are flattened in
  `utils/transforms.ts`.
- **Timeouts** are off by default. Add `AbortSignal.timeout(REQUEST_ABORT_TIMEOUT_MS)`
  to requests that hold a screen (loaders, boot). Never add it to uploads.
- **Tag** records that are pushed or shared (see Normalized cache below).
- Resolve instead of rejecting only when failure _is_ the answer
  (`StatusService`). Otherwise let it reject.

## Enums and status codes

- Server codes come from `ENUMS` (`@irene/enums`, ported 1:1 from irene):
  `submission.status === ENUMS.SUBMISSION_STATUS.ANALYZING`, never `=== 6`.
- Each group also has `UNKNOWN` (-1), `BASE_VALUES` / `BASE_CHOICES` (as
  declared), and `VALUES` / `CHOICES` (with UNKNOWN).
- Type fields from the group:
  `type ApiSubmissionStatus = (typeof ENUMS.SUBMISSION_STATUS)['BASE_VALUES'][number]`.
- Group values with typed `Set`s and `Record`s (`FAILED_STATUSES`,
  `PROGRESS_BY_STATUS` in `upload-app/utils.ts`), not `===` chains.
- Display, in order of preference: the server's `*_humanized` field, then
  `ENUMS_DISPLAY` (e.g. `'iOS'`), then reduce to an outcome and `akMT` it.
  Never show the key.
- Adding an enum: copy it exactly from irene into
  `packages/enums/src/categories/<area>.ts`, and update the group and key
  counts in `packages/enums/src/index.test.ts`.
- HTTP statuses: `HTTP_STATUS_CODES` from `@irene/constants`, compared against
  `getApiErrorStatus(error)`. Never bare numbers. Add missing codes, with a doc
  comment, to `status-codes.ts`. The type is `HttpStatusCode`.

## Queries (`features/<f>/queries/<thing>.ts`)

```ts
export const organizationKeys = {
  all: () => ['organization'] as const,
  me: (orgId: number | string) => [...organizationKeys.all(), 'me', orgId] as const,
};

/** Builds the query for this account's role in one organization. */
export const organizationMeOptions = (orgId: number | string) =>
  queryOptions({
    queryKey: organizationKeys.me(orgId),
    queryFn: () => OrganizationService.getOrganizationMe(orgId),
    staleTime: Infinity,
  });
```

- **Every `queryFn` calls a service**, never `apiRequest` or `fetch`. It may
  add logic around the call.
- Keys nest under `all()`, so `invalidateQueries({ queryKey: xKeys.all() })`
  clears the whole domain.
- Defaults: 30s stale time, retries only on network errors and 5xx, no
  refetch on focus. Comment any override (`staleTime: Infinity`,
  `retry: false` when a 404 is an answer).

**Reading**, always through the `xOptions()` builder:

- In a component that renders the data: `useQuery(xOptions())`. Handle
  `isPending` with a skeleton and errors in place (`getApiErrorStatus`,
  `isRateLimited`). Most pages fetch this way.
- In guards, loaders and actions: `await queryClient.query(xOptions())`. If a
  loader pre-fills the cache, the component still reads it with `useQuery`.
  Never use `useLoaderData`.
- Conditional queries use `enabled`, never a hook inside an `if`. No
  `useEffect` fetching. `getQueryData` only for rare merges.
  `useSuspenseQuery` and `useInfiniteQuery` aren't used.

## Mutations

Put `useMutation` inline when it's short, or in a `use<Action>` hook when the
logic is long or reused (`useLogin`, which returns `{ login, failure }`).

```ts
const recover = useMutation({
  mutationFn: ({ username }: RecoverFormSchema) => AuthService.recoverPassword(username),
  onError: unlessRateLimited((error) => {
    const message = getApiFieldErrors<'username'>(error).username?.[0];

    if (message) {
      form.setError('username', { message });
    } else {
      akNotify.error(akMT('somethingWentWrong'));
    }
  }),
});
```

- `mutationFn` calls a service. Trigger with `.mutate()` and handle outcomes
  in callbacks; `mutateAsync` isn't used.
- `isPending` → `<AkButton loading>`. Use `onSettled` for "either way" cleanup
  (`useLogout`). Mutations are never retried.
- Wrap `onError` in `unlessRateLimited` (429s are announced globally). Field
  errors go onto the form; anything else becomes `akNotify.error(akMT(…))`.
- Updating the cache afterwards, in order of preference:
  1. tagged reply → `useNormalizedRecordCache().write(type, record)`
  2. new row in a visible list → `prependRecordToPage`
  3. patch one row → `setQueryData` + `patchPaginationItem`
  4. otherwise `invalidateQueries`
- Optimistic updates only for small, reversible toggles (the notification
  read state): `cancelQueries`, snapshot, `setQueryData` in `onMutate`, and
  restore the snapshot in `onError`.

## Normalized cache (`@normy/react-query`)

`NormalizationProvider` (in `App.tsx` and the test render helpers) keys records
by `"<type>:<id>"`, so writing a record once updates **every** query holding
it. Only records carrying the client-added `__record` field take part;
everything else behaves like plain TanStack Query.

- **Tag in the service**, after any transform:
  `tagRecordForCaching('file', file)` or
  `tagPaginatedRecordsForCaching('submission', page)`. The result type is
  `ApiTaggedRecord<T>`. Tag every endpoint that returns that type, or one copy
  never updates.
- **New type**: add it to `API_RECORD_TYPES` (the server's name), and to
  `ApiRecordShapes` if hooks need it typed. Only tag types that are pushed or
  shared.
- **Writing**: `useNormalizedRecordCache()` gives `.write(type, record)` to
  patch everywhere and `.readQueriesHolding(type, id)` to invalidate.
  Normalization can't _add_ rows to a list, so use `prependRecordToPage` for
  that.
- **Gotcha**: strip `__record` before sending a cached record as a request
  body.

## Actions

Plain async functions taking `queryClient` first (`endSession`,
`loadConfiguration`, `setupUserAndOrgContext`), callable from routes, hooks
and tests. Use `Promise.all` for independent fetches, and `allSettled` when
one failure shouldn't block the rest.

## Stores (Zustand) vs queries

|                       | Query                            | Store                                                               |
| --------------------- | -------------------------------- | ------------------------------------------------------------------- |
| Holds                 | server data (a service's answer) | client state, or a server value that must be read synchronously     |
| Filled by             | its `queryFn` → service          | an action, the interceptor or the UI. **Never a service directly.** |
| Stays fresh by itself | yes                              | no                                                                  |
| Read                  | `useQuery` / `queryClient.query` | a `use…` hook / `xStore.getState()`                                 |

Today's stores: `configurationStore`, `organizationStore` and
`vulnerabilityStore` are filled from queries by actions for synchronous
reads. `rateLimitStore` is filled by the 429 interceptor, and `uploadAppStore`
holds client-only upload progress.

```ts
export const organizationStore = createStore<OrganizationStore>((set) => ({
  ...NONE_SELECTED,
  select: (organization) => set({ selected: organization }),
  clear: () => set(NONE_SELECTED),
}));

export const useOrganization = () => useStore(organizationStore); // src/hooks
```

- Use `createStore` from `zustand/vanilla`, so guards can read it.
- Give each store a `clear()` and call it from `endSession`, or one account's
  data leaks into the next sign-in.
- Persisted values go under `irene:<name>` keys, with storage access wrapped
  in try/catch.
