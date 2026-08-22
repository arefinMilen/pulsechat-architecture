import { describe, expect, it } from 'vitest';
import {
  apiError,
  normalizeConversation,
  normalizeMessage,
  normalizeUser,
  sortMessagesAscending,
  unwrapList,
} from '../normalize';
import {
  CONVERSATIONS_RESPONSE,
  CREATED_DIRECT_RESPONSE,
  CURRENT_USER_ID,
  LOGIN_RESPONSE,
  ME_RESPONSE,
  MESSAGES_RESPONSE,
  NO_TOKEN_ERROR,
  OTHER_USER_ID,
  SEARCH_RESPONSE,
  SENT_MESSAGE_RESPONSE,
  SOCKET_MESSAGE_FRAME,
  VALIDATION_ERROR,
} from './fixtures';

describe('normalizeUser', () => {
  it('maps _id to id', () => {
    // The bug that broke everything: reading `.id` off a raw payload gives
    // undefined, and `undefined === undefined` made every message look like ours.
    expect(normalizeUser(LOGIN_RESPONSE.user).id).toBe(CURRENT_USER_ID);
  });

  it('never yields an undefined id, whatever the shape', () => {
    for (const raw of [LOGIN_RESPONSE.user, ME_RESPONSE, ...SEARCH_RESPONSE]) {
      expect(normalizeUser(raw).id).toBeTruthy();
    }
  });

  it('accepts a bare id string, as returned when a thread is created', () => {
    expect(normalizeUser('6a889c46e5d6aac9752426e0')).toEqual({
      id: '6a889c46e5d6aac9752426e0',
      name: '',
      phone: '',
    });
  });

  it('degrades to empty strings rather than undefined for missing fields', () => {
    const user = normalizeUser({ _id: 'x' });
    expect(user.name).toBe('');
    expect(user.phone).toBe('');
  });

  it('survives null and undefined', () => {
    expect(normalizeUser(null).id).toBe('');
    expect(normalizeUser(undefined).id).toBe('');
  });
});

describe('normalizeMessage', () => {
  const raw = MESSAGES_RESPONSE.messages[0];

  it('maps _id, conversation and sender to the domain field names', () => {
    const msg = normalizeMessage(raw);
    expect(msg.id).toBe(raw._id);
    expect(msg.conversationId).toBe(raw.conversation);
    expect(msg.senderId).toBe(raw.sender);
  });

  it('leaves sender undefined when the API sends only an id', () => {
    // This is why group transcripts rendered "Unknown" - the name has to come
    // from the conversation's participants instead.
    expect(normalizeMessage(raw).sender).toBeUndefined();
  });

  it('distinguishes our messages from theirs', () => {
    const [ours, theirs] = [
      normalizeMessage(MESSAGES_RESPONSE.messages[0]),
      normalizeMessage(MESSAGES_RESPONSE.messages[1]),
    ];
    expect(ours.senderId).toBe(CURRENT_USER_ID);
    expect(theirs.senderId).toBe(OTHER_USER_ID);
    expect(ours.senderId).not.toBe(theirs.senderId);
  });

  it('does not classify every message as ours', () => {
    // The regression this whole layer exists to prevent.
    const msgs = MESSAGES_RESPONSE.messages.map(normalizeMessage);
    const ours = msgs.filter((m) => m.senderId === CURRENT_USER_ID);
    expect(ours.length).toBeGreaterThan(0);
    expect(ours.length).toBeLessThan(msgs.length);
  });

  it('reads the socket frame, which uses `id` rather than `_id`', () => {
    const msg = normalizeMessage(SOCKET_MESSAGE_FRAME);
    expect(msg.id).toBe(SOCKET_MESSAGE_FRAME.id);
    expect(msg.conversationId).toBe(SOCKET_MESSAGE_FRAME.conversation);
    expect(msg.senderId).toBe(OTHER_USER_ID);
  });

  it('converts the socket frame’s epoch-millisecond createdAt to ISO', () => {
    const { createdAt } = normalizeMessage(SOCKET_MESSAGE_FRAME);
    expect(typeof createdAt).toBe('string');
    expect(new Date(createdAt).getTime()).toBe(SOCKET_MESSAGE_FRAME.createdAt);
  });

  it('passes an ISO createdAt through untouched', () => {
    expect(normalizeMessage(raw).createdAt).toBe(raw.createdAt);
  });

  it('does not invent a clientTempId the API never returned', () => {
    // The API accepts clientTempId but drops it, so the send path has to
    // reattach it locally to reconcile the optimistic bubble.
    expect('clientTempId' in SENT_MESSAGE_RESPONSE).toBe(false);
    expect(normalizeMessage(SENT_MESSAGE_RESPONSE).clientTempId).toBeUndefined();
    expect(normalizeMessage(SENT_MESSAGE_RESPONSE).id).toBe(SENT_MESSAGE_RESPONSE._id);
  });

  it('unwraps an embedded sender object when one is present', () => {
    const msg = normalizeMessage({
      ...raw,
      sender: { _id: OTHER_USER_ID, name: 'Test Client A', phone: '+15550001111' },
    });
    expect(msg.senderId).toBe(OTHER_USER_ID);
    expect(msg.sender?.name).toBe('Test Client A');
  });
});

describe('sortMessagesAscending', () => {
  it('reverses the API’s newest-first ordering', () => {
    const sorted = sortMessagesAscending(MESSAGES_RESPONSE.messages.map(normalizeMessage));
    expect(sorted.map((m) => m.text)).toEqual(['first', 'second', 'third']);
  });

  it('is the fixture, not the sort, that arrives newest-first', () => {
    // Guards against a fixture edited into ascending order, which would make
    // the test above pass for the wrong reason.
    const [head, tail] = [MESSAGES_RESPONSE.messages[0], MESSAGES_RESPONSE.messages.at(-1)!];
    expect(new Date(head.createdAt).getTime()).toBeGreaterThan(
      new Date(tail.createdAt).getTime()
    );
  });

  it('does not mutate the input', () => {
    const input = MESSAGES_RESPONSE.messages.map(normalizeMessage);
    const before = input.map((m) => m.id);
    sortMessagesAscending(input);
    expect(input.map((m) => m.id)).toEqual(before);
  });
});

describe('normalizeConversation', () => {
  const [group, direct] = CONVERSATIONS_RESPONSE.data;

  it('folds a direct thread’s singular `participant` into the array', () => {
    // Missing this rendered every direct thread with no counterpart, so every
    // title fell back to a placeholder.
    const conv = normalizeConversation(direct);
    expect(conv.participants).toHaveLength(1);
    expect(conv.participants[0].name).toBe('Test Client A');
  });

  it('keeps a group’s plural `participants`', () => {
    expect(normalizeConversation(group).participants).toHaveLength(3);
  });

  it('maps `admins` to adminIds', () => {
    expect(normalizeConversation(group).adminIds).toEqual([OTHER_USER_ID]);
  });

  it('defaults adminIds to an empty array for a direct thread', () => {
    expect(normalizeConversation(direct).adminIds).toEqual([]);
  });

  it('treats an empty lastMessage object as no message', () => {
    // The API sends `{}`, which is truthy and would render a blank preview row.
    expect(group.lastMessage).toEqual({});
    expect(normalizeConversation(group).lastMessage).toBeNull();
  });

  it('normalizes a populated lastMessage and back-fills its conversation id', () => {
    const conv = normalizeConversation(direct);
    expect(conv.lastMessage?.text).toBe('autoscroll-test');
    expect(conv.lastMessage?.senderId).toBe(CURRENT_USER_ID);
    expect(conv.lastMessage?.conversationId).toBe(direct._id);
  });

  it('handles the create response, where participants are bare id strings', () => {
    const conv = normalizeConversation(CREATED_DIRECT_RESPONSE);
    expect(conv.id).toBe(CREATED_DIRECT_RESPONSE._id);
    expect(conv.participants.map((p) => p.id)).toEqual(CREATED_DIRECT_RESPONSE.participants);
  });

  it('infers `direct` when the create response omits a type', () => {
    // No `type`, no `name`, and `participants` shares its field name with a
    // group — the absence of a name is the only signal available.
    expect(normalizeConversation(CREATED_DIRECT_RESPONSE).type).toBe('direct');
  });

  it('still reads an explicit type when the API supplies one', () => {
    expect(normalizeConversation(group).type).toBe('group');
    expect(normalizeConversation(direct).type).toBe('direct');
  });
});

describe('unwrapList', () => {
  it('reads the four envelopes the API actually uses', () => {
    expect(unwrapList(CONVERSATIONS_RESPONSE, 'conversations')).toHaveLength(2);
    expect(unwrapList(MESSAGES_RESPONSE, 'messages')).toHaveLength(3);
    expect(unwrapList(SEARCH_RESPONSE, 'users')).toHaveLength(2);
    expect(unwrapList({ users: SEARCH_RESPONSE }, 'users')).toHaveLength(2);
  });

  it('returns an empty array for anything unrecognised', () => {
    for (const payload of [null, undefined, {}, 'nope', 42]) {
      expect(unwrapList(payload, 'messages')).toEqual([]);
    }
  });
});

describe('apiError', () => {
  it('surfaces the field-level message from details[]', () => {
    expect(apiError(VALIDATION_ERROR)).toBe('a group needs at least 3 members');
  });

  it('falls back to the envelope message when there are no details', () => {
    expect(apiError(NO_TOKEN_ERROR)).toBe('No token provided');
  });

  it('explains a timeout in terms a user can act on', () => {
    expect(apiError({ code: 'ECONNABORTED' })).toMatch(/waking up|too long/i);
  });

  it('explains an unreachable server', () => {
    expect(apiError({ message: 'Network Error' })).toMatch(/connection|reach/i);
  });

  it('always returns a non-empty string', () => {
    for (const err of [null, undefined, {}, new Error('boom')]) {
      expect(apiError(err).length).toBeGreaterThan(0);
    }
  });
});

describe('the end-to-end shape a component receives', () => {
  it('turns a raw login + message list into correctly attributed bubbles', () => {
    const me = normalizeUser(LOGIN_RESPONSE.user);
    const msgs = sortMessagesAscending(
      unwrapList(MESSAGES_RESPONSE, 'messages').map(normalizeMessage)
    );

    const attribution = msgs.map((m) => (m.senderId === me.id ? 'me' : 'them'));
    expect(attribution).toEqual(['me', 'them', 'me']);
  });
});
