import { Conversation, Message, User } from '../types';

/**
 * Translation boundary between the upstream API and the app's domain model.
 *
 * The upstream service is a Mongo-backed Express API whose responses diverge
 * from the shapes this app works with in several ways:
 *
 *   - identifiers are `_id`, not `id`
 *   - a message carries `conversation` and `sender` (a bare id string), not
 *     `conversationId` / `senderId`
 *   - direct conversations expose `participant` (a single object) while groups
 *     expose `participants` (an array); `POST /conversations` returns that same
 *     field as an array of id strings
 *   - group admins arrive as `admins`, not `adminIds`
 *   - `lastMessage` is `{}` rather than null when a thread has no messages
 *
 * Every response is funnelled through here so no component or store ever sees a
 * raw API shape.
 *
 * `any` is deliberate at this boundary and nowhere else: these functions exist
 * precisely because the upstream payloads are untyped and inconsistent, and
 * their whole job is to produce the typed domain objects the rest of the app
 * relies on.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

type Raw = Record<string, any>;

const readId = (raw: Raw | string | null | undefined): string => {
  if (!raw) return '';
  if (typeof raw === 'string') return raw;
  return raw._id ?? raw.id ?? '';
};

/**
 * REST returns `createdAt` as an ISO string; the `message:new` socket frame
 * returns it as epoch milliseconds. Both are coerced to ISO here so timestamp
 * formatting and sorting can assume one type.
 */
const readTimestamp = (value: unknown): string => {
  if (typeof value === 'number') return new Date(value).toISOString();
  if (typeof value === 'string' && value) return value;
  return new Date().toISOString();
};

export function normalizeUser(raw: Raw | string | null | undefined): User {
  if (typeof raw === 'string') {
    // Only an id was returned (e.g. participants on a freshly created thread).
    return { id: raw, name: '', phone: '' };
  }

  return {
    id: readId(raw),
    name: raw?.name ?? '',
    phone: raw?.phone ?? '',
    avatarUrl: raw?.avatarUrl,
    createdAt: raw?.createdAt,
  };
}

export function normalizeMessage(raw: Raw): Message {
  const sender = raw?.sender;
  const senderIsObject = !!sender && typeof sender === 'object';

  return {
    id: readId(raw),
    conversationId: readId(raw?.conversation ?? raw?.conversationId),
    senderId: senderIsObject ? readId(sender) : (sender ?? ''),
    sender: senderIsObject ? normalizeUser(sender) : undefined,
    text: raw?.text ?? '',
    createdAt: readTimestamp(raw?.createdAt),
    status: 'sent',
    clientTempId: raw?.clientTempId,
  };
}

/** The API returns messages newest-first; the transcript renders oldest-first. */
export function sortMessagesAscending(messages: Message[]): Message[] {
  return [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function normalizeConversation(raw: Raw): Conversation {
  let participants: User[] = [];

  if (Array.isArray(raw?.participants)) {
    participants = raw.participants.map(normalizeUser);
  } else if (raw?.participant) {
    // Direct threads name the counterpart in the singular.
    participants = [normalizeUser(raw.participant)];
  }

  const conversationId = readId(raw);

  // Empty threads come back as `lastMessage: {}` rather than null.
  const hasLastMessage =
    !!raw?.lastMessage && Object.keys(raw.lastMessage).length > 0;

  // `POST /conversations` omits `type` entirely, and returns `participants` as
  // bare ids — the same field name a group uses. Groups always carry both an
  // explicit `type` and a `name`, so the absence of a name is what identifies a
  // freshly created direct thread.
  const type: Conversation['type'] =
    raw?.type ?? (raw?.participant || !raw?.name ? 'direct' : 'group');

  return {
    id: conversationId,
    type,
    name: raw?.name ?? null,
    participants,
    adminIds: Array.isArray(raw?.admins)
      ? raw.admins.map(readId)
      : Array.isArray(raw?.adminIds)
      ? raw.adminIds.map(readId)
      : [],
    lastMessage: hasLastMessage
      ? normalizeMessage({ ...raw.lastMessage, conversation: conversationId })
      : null,
    updatedAt: readTimestamp(raw?.updatedAt ?? raw?.createdAt),
  };
}

/**
 * Unwraps the API's inconsistent list envelopes. Depending on the endpoint a
 * collection arrives as a bare array, `{ data: [...] }`, `{ messages: [...] }`
 * or `{ users: [...] }`.
 */
export function unwrapList(payload: any, ...keys: string[]): Raw[] {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

/** Flattens the API's `{ error: { message, code, details } }` envelope. */
export function apiError(err: any): string {
  const envelope = err?.response?.data?.error;

  if (Array.isArray(envelope?.details) && envelope.details.length > 0) {
    return envelope.details
      .map((d: Raw) => d?.message)
      .filter(Boolean)
      .join(', ');
  }

  if (envelope?.message) return envelope.message;

  if (err?.code === 'ECONNABORTED') {
    return 'The server took too long to respond. It may be waking up — please try again.';
  }

  if (err?.message === 'Network Error') {
    return 'Could not reach the server. Check your connection and try again.';
  }

  return err?.message ?? 'Something went wrong. Please try again.';
}
