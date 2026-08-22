# PulseChat API Reference

> **How this document was produced.** The Swagger URL supplied with the
> assignment (`/docs/`) serves an unmodified default Swagger UI still pointing at
> `petstore.swagger.io`, and no machine-readable spec is served at `/swagger.json`,
> `/openapi.json`, or `/docs/json`. Everything below was therefore derived by
> probing the live service with an authenticated token and recording actual
> requests and responses. Where the observed behaviour differs from what a clean
> API would do, that is called out in **Notes** rather than quietly smoothed over.

- **REST base URL**: `https://frontend-task-chatapp.onrender.com/api`
- **WebSocket gateway**: `https://frontend-task-chatapp.onrender.com` (Socket.IO, root origin)
- **Content type**: `application/json`
- **Verified**: 22 Aug 2026

The service is hosted on a free Render instance and sleeps when idle. A first
request after a period of inactivity can take up to a minute.

---

## Conventions

### Identifiers

Every persisted entity is keyed by **`_id`** (a MongoDB ObjectId string), not
`id`. The one exception is the `message:new` socket frame, which uses `id`.
Both are handled at a single boundary in this client
([`src/lib/normalize.ts`](../src/lib/normalize.ts)).

### Response envelopes

There is no single envelope. Each endpoint is documented with its own shape:

| Endpoint | Envelope |
| :--- | :--- |
| `POST /auth/login` | `{ token, user }` |
| `GET /auth/me` | bare object |
| `GET /users/search` | bare array |
| `GET /conversations` | `{ data: [...] }` |
| `GET /conversations/{id}/messages` | `{ messages: [...], hasMore }` |
| `POST /messages` | bare object |
| All group mutations | bare conversation object |

### Errors

Failures share one envelope and are returned with an appropriate status code:

```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [{ "path": "participantIds", "message": "a group needs at least 3 members" }]
  }
}
```

| Code | Status | Meaning |
| :--- | :--- | :--- |
| `NO_TOKEN` | 400 | `Authorization` header missing |
| `VALIDATION_ERROR` | 400 | Body failed validation; see `details[]` |
| `NOT_FOUND` | 404 | No route matched the method + path |
| `SERVER_ERROR` | 500 | Unhandled server fault |

**Note.** A missing token returns **400**, not 401. An unroutable path returns
`NOT_FOUND` regardless of method, so a `GET` against a `POST`-only route reads as
though the endpoint does not exist.

### Authentication

All endpoints except `POST /auth/login` require a bearer token:

```http
Authorization: Bearer <token>
```

The token is a JWT (`HS256`) whose `sub` claim is the user's `_id`, valid for
seven days.

---

## 1. Authentication

### `POST /auth/login` — sign in or auto-register

There is no separate registration route. An unrecognised phone number creates an
account; a known one signs in. The supplied `name` is applied on both paths.

**Request**

```json
{ "phone": "+15551234567", "name": "Ada Lovelace" }
```

**Response `200`**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…",
  "user": {
    "_id": "6a883deee5d6aac975220b6a",
    "name": "Ada Lovelace",
    "phone": "+15551234567",
    "createdAt": "2026-08-21T12:00:46.679Z"
  }
}
```

**Note.** The phone number is stored verbatim — no normalisation to E.164 — so
`+15551234567` and `15551234567` register as two separate accounts.

### `GET /auth/me` — current user

Returns the user object **directly**, not wrapped in `{ user }`.

```json
{ "_id": "6a883dee…", "name": "Ada Lovelace", "phone": "+15551234567", "createdAt": "…" }
```

---

## 2. Users

### `GET /users/search?q={query}` — find people

Returns a **bare array**.

```json
[
  { "_id": "6a889c46e5d6aac9752426e0", "name": "ada", "phone": "09876543212" }
]
```

**Notes — the matching rules are not what they look like.**

1. **`name` is matched by an anchored regular expression; `phone` is matched by
   exact equality.** `anikur` finds the user named "anikur"; `nikur` and `kur`
   find nothing. `01750885871` finds that user by number, but `0175088` does not.
   There is no substring search.

2. **The query is interpolated straight into a MongoDB regular expression, so a
   regex metacharacter crashes the endpoint with `500`:**

   ```
   GET /users/search?q=%2B      →  500
   {"error":{"message":"Regular expression is invalid: quantifier does not follow
    a repeatable item","code":51091}}
   ```

   `+`, `*`, `?`, `(`, `)` and `[` all reproduce it. This matters because `+`
   begins most international phone numbers — typing one into a search box takes
   the endpoint down. It is also a regex-injection surface: `q=.` returns 50
   users, and a pathological pattern would be a ReDoS vector.

   **This client escapes metacharacters before sending.** Note the trade-off
   that forces: escaping makes the name regex safe, but because `phone` is
   compared by exact equality, the escaped form (`\+1555…`) no longer equals the
   stored value (`+1555…`). A number stored with a leading `+` therefore cannot
   be found by number at all — sending it raw crashes, sending it escaped
   matches nothing. Those users remain findable by name. Not fixable client-side;
   the endpoint needs to escape its own input and match phone by substring.

3. The result set is unpaginated and **includes the caller** — filter yourself
   out client-side.

4. An empty `q` is not rejected; this client short-circuits instead of sending it.

---

## 3. Conversations

### `GET /conversations` — list threads

Returns `{ data: [...] }`, ordered by `updatedAt` descending.

```json
{
  "data": [
    {
      "_id": "6a88bd7f…",
      "type": "group",
      "name": "Core Engineering",
      "createdBy": "6a88275d…",
      "admins": ["6a88275d…"],
      "participants": [
        { "_id": "6a88275d…", "name": "Ada Lovelace", "phone": "+15550001111" }
      ],
      "lastMessage": {},
      "updatedAt": "2026-08-21T21:05:03.051Z"
    },
    {
      "_id": "6a88a592…",
      "type": "direct",
      "participant": { "_id": "6a88275d…", "name": "Grace Hopper", "phone": "+15550001111" },
      "lastMessage": { "text": "See you then", "sender": "6a883dee…", "createdAt": "…" },
      "updatedAt": "2026-08-21T20:25:18.041Z"
    }
  ]
}
```

**Notes — three inconsistencies worth knowing about.**
1. **`direct` threads expose `participant` (a single object); `group` threads expose `participants` (an array).** A client that only reads `participants` renders every direct thread with no counterpart and therefore no title.
2. **Admins arrive as `admins`, not `adminIds`**, and as bare id strings while `participants` are full objects.
3. **`lastMessage` is `{}`, not `null`, on an empty thread** — truthy, so a naive check renders an empty preview row.

### `POST /conversations` — start a direct thread

**Request** — `{ "userId": "6a889c46…" }`

**Response `200`**

```json
{
  "_id": "6a89524a…",
  "participants": ["6a883dee…", "6a889c46…"],
  "createdAt": "2026-08-22T07:39:54.281Z"
}
```

**Notes.** The create response is shaped differently from the list response:
`participants` is an array of **id strings**, there is no `type`, and the
counterpart's name is absent. This client refetches the list afterwards so the
thread title resolves. The call is idempotent — an existing thread is returned
rather than duplicated.

### `POST /conversations/group` — create a group

**Request**

```json
{ "name": "Core Engineering", "participantIds": ["6a889c46…", "6a88275d…"] }
```

**Response `201`** — the full conversation, with `participants` hydrated as
objects and the creator added to both `participants` and `admins`.

**Note — undocumented constraint.** A group requires **at least three members**,
so `participantIds` must contain **two or more** ids besides the caller. Fewer
returns:

```json
{ "error": { "message": "Validation failed", "code": "VALIDATION_ERROR",
  "details": [{ "path": "participantIds", "message": "a group needs at least 3 members" }] } }
```

This client mirrors the rule in the UI so the constraint is visible before submitting.

### `PATCH /conversations/{id}` — rename a group

`{ "name": "New name" }` → `200` with the updated conversation.

### `POST /conversations/{id}/participants` — add members

`{ "userIds": ["…"] }` → `200` with the updated conversation.

### `DELETE /conversations/{id}/participants/{userId}` — remove a member

`200` with the updated conversation. Passing your own id is how you leave a group.

### `POST /conversations/{id}/admins` — promote to admin

`{ "userId": "…" }` → `200` with the updated conversation.

**Note.** All four mutations return the **full updated conversation**, so a
client can patch local state directly instead of refetching the list.

---

## 4. Messages

### `GET /conversations/{id}/messages?limit={n}` — read history

```json
{
  "messages": [
    {
      "_id": "6a88b42d…",
      "conversation": "6a88a592…",
      "sender": "6a883dee…",
      "text": "See you then",
      "createdAt": "2026-08-21T20:25:17.807Z"
    }
  ],
  "hasMore": true
}
```

**Notes.**
1. **Messages are returned newest-first.** A transcript rendered in array order reads bottom-up; this client sorts ascending on `createdAt`.
2. **`sender` is a bare user id, not an object.** Rendering a sender's name requires resolving it against the conversation's participants.
3. **`conversation`, not `conversationId`.**
4. `hasMore` is returned but there is no documented cursor or `offset`/`before` parameter — only `limit` is honoured, so paging back through a long history is not currently possible.
5. A malformed id yields `500 SERVER_ERROR` (`Cast to ObjectId failed`) rather than `400`.

### `POST /messages` — send

**Request**

```json
{ "conversationId": "6a88a592…", "text": "See you then", "clientTempId": "temp_123" }
```

**Response `200`**

```json
{
  "_id": "6a895248…",
  "conversation": "6a88a592…",
  "sender": "6a883dee…",
  "text": "See you then",
  "createdAt": "2026-08-22T07:39:52.656Z"
}
```

**Notes.**
- `clientTempId` is accepted but **not echoed back**; this client reattaches it locally to reconcile the optimistic bubble.
- Returns `200`, where `201` would be conventional for a creation.
- **An empty or whitespace-only `text` is accepted and stored.** `{"text": ""}`
  returns `200` and persists a blank message; only *omitting* the field
  altogether is rejected (`VALIDATION_ERROR`, `path: "text"`). The requirement
  that empty messages not be sendable is therefore enforced entirely on the
  client — the composer disables the send control and the store rejects a blank
  body before any request is made.

---

## 5. Real-time (Socket.IO)

### Handshake

Connect to the **root origin**, not `/api`, with the JWT in the handshake auth
object:

```ts
import { io } from 'socket.io-client';

const socket = io('https://frontend-task-chatapp.onrender.com', {
  auth: { token },
  transports: ['websocket', 'polling'],
});
```

### `message:new` — server → client

The only event the gateway emits.

```json
{
  "id": "6a895556e5d6aac975290b2e",
  "conversation": "6a88a592e5d6aac97524752d",
  "sender": "6a88275de5d6aac97521e37a",
  "text": "See you then",
  "createdAt": 1787385174937
}
```

**Notes — the frame is not the REST body.**
1. The key is **`id`**, not `_id`.
2. `createdAt` is **epoch milliseconds**, not an ISO string.
3. **The author does not receive their own message.** The broadcast goes only to the other participants, so an optimistic bubble needs no de-duplication against an echo.
4. Delivery is triggered by `POST /messages`. **The gateway does not accept an outbound `message:send` frame** — emitting one is silently dropped, so sending must go over REST.
5. No membership or presence events are emitted. A message arriving for an unknown thread is the only signal that the conversation list is stale; this client refetches when that happens.

---

## Appendix — how this client compensates

| API behaviour | Client handling |
| :--- | :--- |
| `_id` / `id` / `conversation` / `sender` key drift | Single normalization boundary (`src/lib/normalize.ts`) |
| Four different list envelopes | `unwrapList()` helper |
| `participant` vs `participants` | Folded into one `participants: User[]` |
| Numeric vs ISO `createdAt` | Coerced to ISO on ingest |
| Newest-first messages | Sorted ascending before render |
| `lastMessage: {}` | Treated as null when empty |
| Undocumented 3-member group rule | Enforced and explained in the UI |
| Regex injection on `/users/search` | Metacharacters escaped before sending |
| Empty message bodies accepted | Blocked client-side in the composer and store |
| `hasMore` with no cursor | Left unimplemented, documented as a limitation |
| Cold starts | 45s timeout with an explanatory message in the loading state |
