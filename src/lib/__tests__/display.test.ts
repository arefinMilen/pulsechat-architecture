import { describe, expect, it } from 'vitest';
import {
  conversationTitle,
  indexParticipants,
  initialsOf,
  listTimestamp,
  senderName,
  userLabel,
} from '../display';
import { normalizeConversation, normalizeMessage } from '../normalize';
import {
  CONVERSATIONS_RESPONSE,
  CREATED_DIRECT_RESPONSE,
  CURRENT_USER_ID,
  MESSAGES_RESPONSE,
  OTHER_USER_ID,
} from './fixtures';

const [rawGroup, rawDirect] = CONVERSATIONS_RESPONSE.data;
const group = normalizeConversation(rawGroup);
const direct = normalizeConversation(rawDirect);

describe('conversationTitle', () => {
  it('names a direct thread after the other person', () => {
    expect(conversationTitle(direct, CURRENT_USER_ID)).toBe('Test Client A');
  });

  it('uses the group’s own name', () => {
    expect(conversationTitle(group, CURRENT_USER_ID)).toBe('Playwright Group');
  });

  it('never returns our own name for a direct thread', () => {
    // A direct thread lists only the counterpart, but a payload that also
    // includes us must still resolve to the other person.
    const withBoth = {
      ...direct,
      participants: [
        { id: CURRENT_USER_ID, name: 'Audit Bot', phone: '+15550009999' },
        { id: OTHER_USER_ID, name: 'Test Client A', phone: '+15550001111' },
      ],
    };
    expect(conversationTitle(withBoth, CURRENT_USER_ID)).toBe('Test Client A');
  });

  it('falls back to a phone number when a name is missing', () => {
    const conv = normalizeConversation({
      ...rawDirect,
      participant: { _id: 'x', name: '', phone: '+15550001111' },
    });
    expect(conversationTitle(conv, CURRENT_USER_ID)).toBe('+15550001111');
  });

  it('gives a freshly created thread a placeholder rather than a blank header', () => {
    // The create response has no `type` and no `name`; before this was handled
    // it was inferred as a group and titled "Unnamed group".
    const conv = normalizeConversation(CREATED_DIRECT_RESPONSE);
    expect(conv.type).toBe('direct');
    expect(conversationTitle(conv, CURRENT_USER_ID)).toBe('New conversation');
  });

  it('labels an unnamed group rather than rendering nothing', () => {
    expect(conversationTitle({ ...group, name: null }, CURRENT_USER_ID)).toBe('Unnamed group');
  });
});

describe('senderName', () => {
  const participantsById = indexParticipants(group.participants);
  const fromOther = normalizeMessage(MESSAGES_RESPONSE.messages[1]);

  it('resolves a bare sender id against the participant list', () => {
    // The API never embeds the author, so without this every group message
    // rendered the literal string "Unknown".
    expect(fromOther.sender).toBeUndefined();
    expect(senderName(fromOther, participantsById)).toBe('Test Client A');
  });

  it('never renders "Unknown" for a current participant', () => {
    for (const raw of MESSAGES_RESPONSE.messages) {
      expect(senderName(normalizeMessage(raw), participantsById)).not.toBe('Unknown');
    }
  });

  it('prefers an embedded sender, as optimistic messages carry', () => {
    const optimistic = {
      senderId: CURRENT_USER_ID,
      sender: { id: CURRENT_USER_ID, name: 'Audit Bot', phone: '+15550009999' },
    };
    expect(senderName(optimistic, new Map())).toBe('Audit Bot');
  });

  it('labels someone who has left the group instead of failing', () => {
    const departed = indexParticipants(
      group.participants.filter((p) => p.id !== OTHER_USER_ID)
    );
    expect(senderName(fromOther, departed)).toBe('Former member');
  });

  it('falls back to a phone number when a participant has no name', () => {
    const byId = indexParticipants([{ id: OTHER_USER_ID, name: '', phone: '+15550001111' }]);
    expect(senderName(fromOther, byId)).toBe('+15550001111');
  });
});

describe('indexParticipants', () => {
  it('indexes every participant by id', () => {
    expect(indexParticipants(group.participants).size).toBe(3);
  });

  it('skips entries with no id rather than keying on empty string', () => {
    expect(indexParticipants([{ id: '', name: 'Ghost', phone: '' }]).size).toBe(0);
  });
});

describe('initialsOf', () => {
  it('takes first and last initials from a full name', () => {
    expect(initialsOf('Ada Lovelace')).toBe('AL');
  });

  it('takes two letters from a single word', () => {
    expect(initialsOf('anikur')).toBe('AN');
  });

  it('ignores extra whitespace', () => {
    expect(initialsOf('  Grace   Brewster   Hopper  ')).toBe('GH');
  });

  it('does not crash on an empty label', () => {
    expect(initialsOf('')).toBe('?');
    expect(initialsOf('   ')).toBe('?');
  });
});

describe('userLabel', () => {
  it('prefers the name', () => {
    expect(userLabel({ id: '1', name: 'ada', phone: '0987' })).toBe('ada');
  });

  it('falls back to the phone number', () => {
    expect(userLabel({ id: '1', name: '', phone: '0987' })).toBe('0987');
  });

  it('always returns something renderable', () => {
    expect(userLabel({ id: '1', name: '', phone: '' })).toBe('Unknown user');
  });
});

describe('listTimestamp', () => {
  const at = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    return d.toISOString();
  };

  it('shows a clock time for today', () => {
    expect(listTimestamp(at(0))).toMatch(/\d/);
    expect(listTimestamp(at(0))).not.toBe('Yesterday');
  });

  it('says "Yesterday" for yesterday', () => {
    expect(listTimestamp(at(1))).toBe('Yesterday');
  });

  it('names the weekday within the last week', () => {
    expect(listTimestamp(at(3))).toMatch(/^[A-Za-z]{3}/);
  });

  it('returns an empty string for an unparseable date rather than "Invalid Date"', () => {
    expect(listTimestamp('not-a-date')).toBe('');
  });
});
