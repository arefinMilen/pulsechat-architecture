# PulseChat

A real-time chat application built for the frontend take-home assignment.

- **Chat app (Part 1)** — https://pulsechat-architecture.vercel.app/login
- **Landing page (Part 2)** — https://pulsechat-architecture.vercel.app
- **API reference** — [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md)
- **OpenAPI 3.1 spec** — [`docs/openapi.yaml`](docs/openapi.yaml)

> The API is hosted on a free Render instance that sleeps when idle. The first
> request after a quiet period can take up to a minute; the UI says so while it
> waits rather than silently spinning.

---

## Tech stack

| | |
| :--- | :--- |
| Framework | Next.js 15 (App Router), React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| Transport | Axios (REST), Socket.IO client (live messages) |
| Icons | lucide-react |

Seven runtime dependencies, all of them used. There is no state-management or
animation library carried along unused.

---

## Running locally

```bash
git clone https://github.com/arefinMilen/pulsechat-architecture.git
cd pulsechat-architecture
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build      # production build
npm run lint       # eslint
npx tsc --noEmit   # type check
```

No environment variables are required — the API base URL is a constant. Set
`NEXT_PUBLIC_SITE_URL` only if you deploy to a custom domain (metadata, sitemap,
and robots pick it up; on Vercel `VERCEL_URL` is used automatically).

---

## Project structure

```
src/
├─ app/
│  ├─ (auth)/login/      Sign-in screen
│  ├─ (chat)/chat/       Chat screen (master/detail shell)
│  ├─ og/                Generated OG image
│  └─ page.tsx           Landing page (Part 2)
├─ components/
│  ├─ chat/              Conversation list, transcript, composer, modals
│  ├─ landing/           Landing sections + network simulator
│  └─ ui/Modal.tsx       Accessible dialog shell
├─ hooks/
│  ├─ useChatScroll.ts   Threshold auto-scroll + unread pill
│  └─ useNetworkStatus.ts
├─ lib/
│  ├─ api-client.ts      Typed API surface
│  ├─ normalize.ts       API → domain translation boundary
│  ├─ display.ts         Titles, initials, timestamps
│  └─ socket.ts          Socket.IO lifecycle
└─ store/                Zustand stores (auth, chat, simulator)
```

---

# Part 3 — Write-up

## Part 1: architecture and trade-offs

### Documenting the API first surfaced the real problem

The Swagger URL in the brief (`/docs/`) serves an **unmodified default Swagger
UI still pointing at `petstore.swagger.io`**, and no spec is published at
`/swagger.json`, `/openapi.json`, or `/docs/json`. So the documentation
deliverable could not be a transcription — the API had to be mapped by probing
the live service with an authenticated token and recording what actually came
back.

That turned out to be the single most valuable hour of the project, because the
API's real shapes differ from the obvious assumptions in ways that break a
client silently rather than loudly:

| Assumption | Reality |
| :--- | :--- |
| `id` | Everything is keyed by **`_id`** — except the socket frame, which uses `id` |
| `message.conversationId` / `senderId` | The fields are `conversation` and `sender`, and `sender` is a **bare id string**, not an object |
| `participants` on every thread | Direct threads carry a **singular `participant` object**; only groups carry the array |
| `adminIds` | The field is `admins` |
| `lastMessage: null` when empty | It is `{}` — truthy |
| Messages oldest-first | They arrive **newest-first** |
| Socket payload matches REST | It uses `id` and an **epoch-millisecond** `createdAt` |

The most dangerous one is `_id`. Reading `user.id` yields `undefined`, and
`message.senderId` is `undefined` too — so `senderId === currentUser.id` is
`undefined === undefined`, which is **`true` for every message**. A client that
misses this renders the entire transcript as though the user sent all of it,
while looking completely functional.

### One translation boundary, not scattered patching

Rather than sprinkle `?? _id` fallbacks through the components, everything the
API returns passes through [`src/lib/normalize.ts`](src/lib/normalize.ts). It is
the only module in the codebase that knows `_id`, `participant`, `admins`, or
epoch timestamps exist. Components consume a clean `User` / `Conversation` /
`Message`.

**Trade-off:** an extra mapping pass on every response, and a place that must be
updated if the API changes. Worth it — the alternative is the same knowledge
duplicated across a dozen components, where one missed spot is a silent bug of
exactly the kind described above.

### Zustand rather than a server-cache library

Two Zustand stores: one for the session, one for chat state. I considered
TanStack Query, but the messages here are **push-driven, not poll-driven** — the
authoritative update arrives over a socket, not from a refetch. Under a query
cache, every inbound socket message becomes a manual `setQueryData` write, and
the cache's invalidation and staleness machinery sits unused while adding a
dependency and a mental model.

**Trade-off:** no request deduplication or background refetching for free, and
`fetchMessages` is hand-written. At this size that is a few lines. If message
history needed real pagination and cache eviction, the calculus would flip.

### Sending: optimistic, REST-only

Probing the gateway settled the send path. Two findings:

1. The server **does not accept an outbound `message:send` frame** — emitting one
   is silently dropped. `POST /messages` is what triggers the broadcast, so
   sending must go over REST.
2. The server **does not echo a message back to its author**. `message:new`
   reaches only the other participants.

That second point is a gift: the optimistic bubble is the sole render of an
outbound message, so there is no echo to de-duplicate against. A message renders
instantly with a `sending` state, keyed by a `clientTempId`, and is reconciled
with the server record when the POST resolves. `clientTempId` is accepted by the
API but not returned, so it is reattached client-side.

A send that fails is marked **undelivered with a retry action in place** — the
failure is visible and recoverable rather than a bubble that quietly never
arrives.

### Auto-scroll ([`useChatScroll`](src/hooks/useChatScroll.ts))

The requirement is that the view follows new messages but does not yank a
reader back down. The hook measures
`scrollHeight - scrollTop - clientHeight` on each change: within **80px** of the
bottom counts as "following" and auto-scrolls; beyond it, the scroll position is
left alone and a floating pill accumulates a count of what arrived. Tapping it
returns to the bottom and clears the count. The scroll listener is `passive`
so it never blocks the compositor.

### What I deliberately did not do

An earlier iteration of this project wrapped every API call in
`try { real } catch { return mockData }`. It made the app look robust during
development, and it is what hid the `_id` bug: with the real API returning
`200`s that mapped to `undefined` ids, the failures fell through to fabricated
contacts instead of surfacing.

**All of that is gone.** Errors propagate and are rendered — a retry banner in
the transcript, an inline message in each modal, a validation message on the
login form. When the API is down the app says so. Nothing is faked to look like
it worked, which is the only version of "error states handled" that is worth
anything.

### Bonus: retry-in-place, and enforcing an undocumented server rule

The API rejects a group with fewer than three members
(`"a group needs at least 3 members"`), but nothing in the response tells a
client this up front. The create-group dialog **enforces the rule in the UI**,
explains it before you can hit an error, and surfaces the server's
`details[]` messages verbatim if one gets through. Combined with per-message
retry, the theme is the same: the constraint and the failure are both visible
where the user is, not buried in a console.

---

## Part 2: design reasoning

The landing page has one job — explain what the chat app does to someone who has
not seen it — so the copy leads with **behaviour, not architecture**: "messages
arrive on their own", "the scroll position stays where you put it".

**Palette.** Near-black (`#090D16`) with layered panels (`#0D1322`, `#151D30`)
and a single indigo accent. A chat interface is mostly other people's content;
one accent means the eye reads emphasis as meaning rather than decoration. The
same tokens drive both the landing page and the app, so the two read as one
product.

**Type and layout.** Inter throughout, with a wide size ramp — a `text-7xl`
hero against `text-xs` metadata — to carry hierarchy without extra colours or
rules. Layout is mobile-first: single column below `md`, widening to grids
above.

**Motion.** Restrained on purpose. Transitions on hover and focus, a subtle
gradient wash behind the hero, and nothing that animates on scroll. In a page
about a chat app, movement should read as "a message arrived," so spending it on
decoration would be spending the wrong currency.

### Bonus: the network simulator

The interesting parts of a chat client are invisible when the network is good.
The landing page therefore embeds a **self-contained simulation of the send
path** — sender and recipient side by side, with controls for latency (20ms /
300ms / 1500ms) and an offline toggle. Send a message at 1500ms and you can
watch the optimistic bubble sit in `sending` on the left while the right stays
empty; go offline and messages queue, then flush on reconnect.

It is a model, not a live connection, and it is **labelled as such on the page**
— the telemetry is produced by the simulation, not measured against the hosted
API. The point is to let someone evaluate the behaviour without opening two
browsers and throttling DevTools.

---

## How I used AI

I used **Claude Code (CLI)** throughout, and the split of work was roughly:

| Task | What the AI did | What I changed or rejected |
| :--- | :--- | :--- |
| API discovery | Ran the probe requests and tabulated responses | Kept — this was mechanical and it was faster. I verified each finding by re-running the calls myself |
| API documentation | Drafted the Markdown and OpenAPI from the probe results | Restructured around the **quirks**. The first draft documented an idealised API; the value is in the "Notes" calling out `_id`, the singular `participant`, and the 3-member rule |
| Normalization layer | Wrote the first version of `normalize.ts` | Kept the structure. Added the socket-frame divergence (`id`, epoch ms) after probing turned it up, which the draft had missed |
| Review | Audited the codebase against the brief | This is where it earned its keep — it caught the `_id` bug, the reversed transcript, and the mobile layout collapse |
| Copy | Drafted landing and UI text | Rewrote most of it. The drafts reached for "enterprise", "sub-50ms", "precision engine". Unmeasured superlatives are worse than plain description |

**The most important thing it produced was a criticism, not code.** The audit
that found the `_id` mismatch also found that my README claimed TanStack Query
and an IndexedDB offline queue that the code did not implement — the libraries
were installed, but `grep` returned one import and zero uses. I removed the
claims, uninstalled the packages, and rewrote this document to describe what is
actually here. That is the correction I would most want a reviewer to know I
made.

I verified the finished client against the live API with a throwaway integration
script — 26 assertions covering id mapping, direct-thread titles, message
ordering, sender/receiver classification, the group-size rejection, and the
socket frame shape. All passed. It is not committed because there is no test
runner configured, which is the first thing I would add.

---

## Issues I ran into with the API

1. **The Swagger link does not work.** `/docs/` is a default Swagger UI whose
   `swagger-initializer.js` still points at `petstore.swagger.io`; no spec is
   served at any conventional path. **Handled by** mapping the API through live
   probes and writing the spec in [`docs/openapi.yaml`](docs/openapi.yaml).

2. **Identifiers are `_id`, except over the socket, where they are `id`.**
   **Handled in** `normalize.ts`, which accepts either.

3. **Four different response envelopes.** `{data}`, `{messages, hasMore}`, a bare
   array, and a bare object, across five endpoints. **Handled by** an
   `unwrapList()` helper.

4. **`direct` uses `participant`, `group` uses `participants`.** A client reading
   only the plural renders every DM without a counterpart, so every direct thread
   falls back to a placeholder title. **Handled by** folding both into one array.

5. **Messages return newest-first**, with `hasMore: true` but no cursor,
   `offset`, or `before` parameter — only `limit` is honoured. **Handled by**
   sorting ascending. Paging back through a long history is not currently
   possible; noted as a limitation rather than faked.

6. **`POST /conversations` returns a different shape than `GET /conversations`** —
   `participants` as bare id strings, no `type`, no counterpart name. **Handled
   by** refetching the list after creating a thread so the title resolves.

7. **Undocumented 3-member minimum for groups.** **Handled by** mirroring the
   rule in the UI and surfacing `error.details[]`.

8. **Status codes are loose.** A missing token returns **400**, not 401. A
   malformed conversation id returns **500** (`Cast to ObjectId failed`) rather
   than 400. `POST /messages` returns 200 where 201 would be conventional. A
   `GET` on a `POST`-only route returns `NOT_FOUND`, which reads as though the
   endpoint does not exist at all — this cost me time before I started probing
   with the right method.

9. **Phone numbers are stored verbatim** with no E.164 normalisation, so
   `+15551234567` and `15551234567` become two separate accounts. Not worked
   around; noted.

10. **`clientTempId` is accepted but not echoed back.** **Handled by**
    reattaching it locally for optimistic reconciliation.

---

## What I would do differently with more time

1. **Tests.** The normalization layer is pure functions over recorded API
   payloads — near-ideal unit-test material, and exactly where the expensive bugs
   were. Vitest plus a Playwright pass over send/receive across two sessions.
2. **Message pagination.** `hasMore` is returned; with a cursor parameter (or a
   documented `before`) this becomes load-older-on-scroll-to-top with scroll
   anchoring.
3. **A real offline queue.** The composer currently blocks sending while offline,
   which is honest but not helpful. Persisting pending messages to IndexedDB and
   flushing on reconnect is the right behaviour — I removed the claim rather than
   ship a stub of it.
4. **Resolve group sender names.** `message.sender` is a bare id; names come from
   the conversation's participant list, so a message from someone who has since
   left a group shows no name. A small user cache would fix it.
5. **Read receipts and typing indicators.** The gateway emits neither today, so
   both would need server work.
6. **Virtualised transcript.** Fine at current volumes; a long history would want
   windowing.

---

## Assumptions

- Groups need a name; direct threads take their title from the counterpart.
- The most recent conversation opens automatically on desktop. On mobile the
  list is the landing view, since auto-opening a thread would hide it behind a
  screen the user did not ask for.
- Message search filters the currently loaded page of a conversation, not the
  full server-side history — there is no search endpoint.
- `limit=50` is a reasonable default page size, since none is documented.
