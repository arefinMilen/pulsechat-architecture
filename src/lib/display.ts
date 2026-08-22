import { Conversation, Message, User } from '../types';

/**
 * Resolves the label for a thread.
 *
 * Group threads carry an explicit `name`. Direct threads have none — the API
 * returns only the counterpart under `participant`, which the normalizer folds
 * into a single-entry `participants` array. A thread created in this session
 * comes back with bare ids and no names until the list is refetched, so an
 * interim placeholder is used rather than rendering an empty header.
 */
export function conversationTitle(
  conversation: Conversation,
  currentUserId?: string
): string {
  if (conversation.type === 'group') {
    return conversation.name?.trim() || 'Unnamed group';
  }

  const counterpart =
    conversation.participants.find((p) => p.id && p.id !== currentUserId) ??
    conversation.participants[0];

  return counterpart?.name?.trim() || counterpart?.phone?.trim() || 'New conversation';
}

/** Two-character avatar fallback, e.g. "Ada Lovelace" -> "AL". */
export function initialsOf(label: string): string {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/** A person's display name, falling back to their number. */
export function userLabel(user: User): string {
  return user.name?.trim() || user.phone?.trim() || 'Unknown user';
}

/**
 * Names the author of a message.
 *
 * The API returns `message.sender` as a bare user id rather than an embedded
 * object, so the name has to be resolved against the conversation's own
 * participant list. Optimistic messages carry a real `sender`, so that is
 * preferred when present.
 *
 * A sender absent from the list is someone who has since left the group — their
 * messages remain in the transcript, so they get a neutral label rather than
 * "Unknown".
 */
export function senderName(
  message: Pick<Message, 'senderId' | 'sender'>,
  participantsById: Map<string, User>
): string {
  const embedded = message.sender?.name?.trim();
  if (embedded) return embedded;

  const participant = message.senderId ? participantsById.get(message.senderId) : undefined;
  return participant ? userLabel(participant) : 'Former member';
}

/** Indexes a participant list by id for per-message name lookups. */
export function indexParticipants(participants: User[]): Map<string, User> {
  const byId = new Map<string, User>();
  for (const person of participants) {
    if (person.id) byId.set(person.id, person);
  }
  return byId;
}

/**
 * Short relative timestamp for the conversation list: a clock time today, a
 * weekday this week, and a date beyond that.
 */
export function listTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const elapsedDays = Math.floor(
    (now.setHours(0, 0, 0, 0) - new Date(iso).setHours(0, 0, 0, 0)) / 86_400_000
  );

  if (elapsedDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (elapsedDays === 1) return 'Yesterday';
  if (elapsedDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
}
