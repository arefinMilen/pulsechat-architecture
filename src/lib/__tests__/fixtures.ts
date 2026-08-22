/**
 * Payloads recorded verbatim from the live API on 22 Aug 2026.
 *
 * These are not hand-written approximations. Every shape here — the `_id` keys,
 * the singular `participant` on direct threads, `lastMessage: {}`, the
 * newest-first message ordering, and the socket frame's `id` plus
 * epoch-millisecond `createdAt` — was captured from a real response. Editing
 * one to make a test pass would defeat the point of the file.
 */

/** `POST /auth/login` */
export const LOGIN_RESPONSE = {
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YTg4M2RlZSJ9.signature',
  user: {
    _id: '6a883deee5d6aac975220b6a',
    name: 'Audit Bot',
    phone: '+15550009999',
    createdAt: '2026-08-21T12:00:46.679Z',
  },
};

/** `GET /auth/me` — the user object bare, not wrapped in `{ user }`. */
export const ME_RESPONSE = {
  _id: '6a883deee5d6aac975220b6a',
  name: 'Audit Bot',
  phone: '+15550009999',
  createdAt: '2026-08-21T12:00:46.679Z',
};

/** `GET /users/search?q=ada` — a bare array. */
export const SEARCH_RESPONSE = [
  { _id: '6a889c46e5d6aac9752426e0', name: 'ada', phone: '09876543212' },
  { _id: '6a8826d5e5d6aac97521e2b4', name: 'anikur', phone: '01750885871' },
];

/** `GET /conversations` — `{ data: [...] }`, newest first. */
export const CONVERSATIONS_RESPONSE = {
  data: [
    {
      // A group: plural `participants`, `admins`, and an EMPTY lastMessage.
      _id: '6a88bd7fe5d6aac9752535b5',
      type: 'group',
      lastMessage: {},
      updatedAt: '2026-08-21T21:05:03.051Z',
      name: 'Playwright Group',
      createdBy: '6a88275de5d6aac97521e37a',
      admins: ['6a88275de5d6aac97521e37a'],
      participants: [
        { _id: '6a88275de5d6aac97521e37a', name: 'Test Client A', phone: '+15550001111' },
        { _id: '6a883deee5d6aac975220b6a', name: 'Audit Bot', phone: '+15550009999' },
        { _id: '6a88a562e5d6aac97524733b', name: 'Docs Probe C', phone: '+15550008888' },
      ],
    },
    {
      // A direct thread: SINGULAR `participant`, no `participants` array.
      _id: '6a88a592e5d6aac97524752d',
      type: 'direct',
      lastMessage: {
        text: 'autoscroll-test',
        sender: '6a883deee5d6aac975220b6a',
        createdAt: '2026-08-21T20:25:17.807Z',
      },
      updatedAt: '2026-08-21T20:25:18.041Z',
      participant: {
        _id: '6a88275de5d6aac97521e37a',
        name: 'Test Client A',
        phone: '+15550001111',
      },
    },
  ],
};

/**
 * `POST /conversations` — narrower than the list shape: `participants` are bare
 * id strings, and there is no `type`.
 */
export const CREATED_DIRECT_RESPONSE = {
  _id: '6a89524ae5d6aac97528e9b7',
  participants: ['6a883deee5d6aac975220b6a', '6a889c46e5d6aac9752426e0'],
  createdAt: '2026-08-22T07:39:54.281Z',
};

/** `GET /conversations/{id}/messages` — NEWEST FIRST, `sender` is a bare id. */
export const MESSAGES_RESPONSE = {
  messages: [
    {
      _id: '6a88b42de5d6aac97524f56d',
      conversation: '6a88a592e5d6aac97524752d',
      sender: '6a883deee5d6aac975220b6a',
      text: 'third',
      createdAt: '2026-08-21T20:25:17.807Z',
    },
    {
      _id: '6a88b33be5d6aac97524ed1f',
      conversation: '6a88a592e5d6aac97524752d',
      sender: '6a88275de5d6aac97521e37a',
      text: 'second',
      createdAt: '2026-08-21T20:21:15.678Z',
    },
    {
      _id: '6a88b286e5d6aac97524e7ad',
      conversation: '6a88a592e5d6aac97524752d',
      sender: '6a883deee5d6aac975220b6a',
      text: 'first',
      createdAt: '2026-08-21T20:18:14.839Z',
    },
  ],
  hasMore: true,
};

/** `POST /messages` — note `clientTempId` is NOT echoed back. */
export const SENT_MESSAGE_RESPONSE = {
  _id: '6a895248e5d6aac97528e986',
  conversation: '6a88a592e5d6aac97524752d',
  sender: '6a883deee5d6aac975220b6a',
  text: 'audit probe',
  createdAt: '2026-08-22T07:39:52.656Z',
};

/**
 * The `message:new` socket frame. Diverges from REST: `id` not `_id`, and
 * `createdAt` in epoch milliseconds.
 */
export const SOCKET_MESSAGE_FRAME = {
  id: '6a895556e5d6aac975290b2e',
  conversation: '6a88a592e5d6aac97524752d',
  sender: '6a88275de5d6aac97521e37a',
  text: 'realtime probe',
  createdAt: 1787385174937,
};

/** The shared error envelope, here from an undersized group. */
export const VALIDATION_ERROR = {
  response: {
    data: {
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: [{ path: 'participantIds', message: 'a group needs at least 3 members' }],
      },
    },
  },
};

export const NO_TOKEN_ERROR = {
  response: { data: { error: { message: 'No token provided', code: 'NO_TOKEN' } } },
};

export const CURRENT_USER_ID = '6a883deee5d6aac975220b6a';
export const OTHER_USER_ID = '6a88275de5d6aac97521e37a';
