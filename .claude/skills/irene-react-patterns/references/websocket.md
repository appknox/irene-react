# Websocket (`@irene/websocket`)

Server push becomes cache updates and signals. Read the Normalized cache
section of `api-and-data.md` first: most live updates are just tagged records.

> `packages/websocket/README.md` is out of date; follow the code. The real
> connection options are `noticeHandlers: { onMessage, onUnreadCount }` (no
> `product`). Counter signals are `'<Class>Counter'`. The cache adapter is
> `useNormalizedRecordCache`.

## Flow

The connection is Socket.IO, joining room = `user.socket_id`. All event policy
lives in **`cache/dispatch.ts`**:

| Event                  | Effect                                                                    |
| ---------------------- | ------------------------------------------------------------------------- |
| `model_updated`        | `cache.write` (every query holding the record updates) + record listeners |
| `model_created`        | signal `'<type>'` + record listeners (not cached: no list holds it yet)   |
| `object` / `newobject` | invalidate queries holding it (300ms debounce)                            |
| `counter`              | signal `'<Class>Counter'`                                                 |
| `message`              | `akNotify` toast                                                          |
| `notification`         | unread count written into its query                                       |

The connection opens **once**, in `AuthenticatedLayout` via
`useDashboardWebsocket`. `endSession` closes it. Pages never connect.

## In a page (pick the first that fits)

1. **Record changes** → tag it in the service. No page code needed.
2. **List should grow** → `useWebsocketSignal('SubmissionCounter', refetch)`,
   or `useWebsocketSignal('submission', invalidate)`. Signal names are typed.
3. **Act on the pushed record** →
   `useWebsocketRecord('submission', (s) => prependRecordToPage(queryClient, key, 'submission', s))`.
4. **After your own mutation** → `raiseWebsocketSignal('InvitationCounter')`.
5. **No event exists** → `...pollUntil({ intervalMs, isDone })` on the query
   (not used yet).

Device-farm streams (`holdDeviceSession` etc.) exist but aren't used yet.

## New server event

- **New record type**: add it to `API_RECORD_TYPES` (plus `ApiRecordShapes`)
  and tag it in its services. If the server sends `object` events for it,
  map the plural in `_RECORD_TYPE_BY_OBJECT_TYPE` (`dispatch.ts`).
- **New counter**: add it to `WEBSOCKET_COUNTERS` (`events/index.ts`).
- **New event name**: add it to `WEBSOCKET_EVENTS` with a payload type
  (mirror the server's `notify.py`). Add a handler via `_onPayloadWith` in
  `dispatch.ts`, and update the event list in `dispatch.test.ts`. UI-facing
  events extend `WebsocketNoticeHandlers`.

## Tests

```ts
const serverSends = (event: string, payload: unknown) =>
  act(() => {
    websocketTransport.emit(event, payload);
  });

server.use(http.get(LIST_URL, () => HttpResponse.error())); // only the push can update the UI
serverSends(WEBSOCKET_EVENTS.modelUpdated, {
  model_name: 'submission',
  data: tagRecordForCaching('submission', updated),
});
```

`websocketTransport` (from `@tests/setup`) is a fake installed for every test.
`.room` shows the joined room. Break the refetch path so the test proves the
push worked.
