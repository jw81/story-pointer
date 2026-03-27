import { describe, it, expect, beforeEach } from 'vitest';
import {
  createRoom,
  getRoom,
  roomExists,
  addParticipant,
  removeParticipant,
  castVote,
  revealVotes,
  resetRoom,
  setTicketUrl,
  sanitizeState,
  clearAllRooms,
} from './roomManager.js';

beforeEach(() => {
  clearAllRooms();
});

describe('createRoom', () => {
  it('creates a room with correct defaults', () => {
    const room = createRoom('owner-1');
    expect(room.id).toHaveLength(8);
    expect(room.ownerId).toBe('owner-1');
    expect(room.phase).toBe('voting');
    expect(room.participants.size).toBe(0);
  });

  it('creates rooms with unique ids', () => {
    const r1 = createRoom('o1');
    const r2 = createRoom('o2');
    expect(r1.id).not.toBe(r2.id);
  });
});

describe('getRoom / roomExists', () => {
  it('returns room when it exists', () => {
    const room = createRoom('o1');
    expect(getRoom(room.id)).toBe(room);
    expect(roomExists(room.id)).toBe(true);
  });

  it('returns null for non-existent room', () => {
    expect(getRoom('nope')).toBeNull();
    expect(roomExists('nope')).toBe(false);
  });
});

describe('addParticipant', () => {
  it('adds a participant with correct fields', () => {
    const room = createRoom('o1');
    addParticipant(room.id, 's1', 'Dev');
    const p = room.participants.get('s1');
    expect(p.id).toBe('s1');
    expect(p.role).toBe('Dev');
    expect(p.displayName).toBe('Dev');
    expect(p.vote).toBeNull();
    expect(p.hasVoted).toBe(false);
  });

  it('returns null for non-existent room', () => {
    expect(addParticipant('nope', 's1', 'Dev')).toBeNull();
  });
});

describe('display name computation', () => {
  it('uses role name when only one of that role', () => {
    const room = createRoom('o1');
    addParticipant(room.id, 's1', 'Dev');
    addParticipant(room.id, 's2', 'Product');
    expect(room.participants.get('s1').displayName).toBe('Dev');
    expect(room.participants.get('s2').displayName).toBe('Product');
  });

  it('numbers participants when multiple share a role', () => {
    const room = createRoom('o1');
    addParticipant(room.id, 's1', 'Dev');
    addParticipant(room.id, 's2', 'Dev');
    addParticipant(room.id, 's3', 'Dev');
    expect(room.participants.get('s1').displayName).toBe('Dev 1');
    expect(room.participants.get('s2').displayName).toBe('Dev 2');
    expect(room.participants.get('s3').displayName).toBe('Dev 3');
  });

  it('recomputes on removal', () => {
    const room = createRoom('o1');
    addParticipant(room.id, 's1', 'Dev');
    addParticipant(room.id, 's2', 'Dev');
    expect(room.participants.get('s1').displayName).toBe('Dev 1');

    removeParticipant(room.id, 's2');
    expect(room.participants.get('s1').displayName).toBe('Dev');
  });
});

describe('removeParticipant', () => {
  it('removes the participant', () => {
    const room = createRoom('o1');
    addParticipant(room.id, 's1', 'Dev');
    addParticipant(room.id, 's2', 'Product');
    removeParticipant(room.id, 's1');
    expect(room.participants.has('s1')).toBe(false);
    expect(room.participants.size).toBe(1);
  });

  it('deletes room when last participant leaves', () => {
    const room = createRoom('o1');
    addParticipant(room.id, 's1', 'Dev');
    const result = removeParticipant(room.id, 's1');
    expect(result).toBeNull();
    expect(roomExists(room.id)).toBe(false);
  });

  it('transfers ownership when owner leaves', () => {
    const room = createRoom('o1');
    addParticipant(room.id, 'o1', 'Product');
    addParticipant(room.id, 's2', 'Dev');
    removeParticipant(room.id, 'o1');
    expect(room.ownerId).toBe('s2');
  });

  it('returns null for non-existent room', () => {
    expect(removeParticipant('nope', 's1')).toBeNull();
  });
});

describe('castVote', () => {
  it('records a vote', () => {
    const room = createRoom('o1');
    addParticipant(room.id, 's1', 'Dev');
    castVote(room.id, 's1', '5');
    const p = room.participants.get('s1');
    expect(p.vote).toBe('5');
    expect(p.hasVoted).toBe(true);
  });

  it('toggles vote off when same value cast again', () => {
    const room = createRoom('o1');
    addParticipant(room.id, 's1', 'Dev');
    castVote(room.id, 's1', '5');
    castVote(room.id, 's1', '5');
    const p = room.participants.get('s1');
    expect(p.vote).toBeNull();
    expect(p.hasVoted).toBe(false);
  });

  it('changes vote when different value cast', () => {
    const room = createRoom('o1');
    addParticipant(room.id, 's1', 'Dev');
    castVote(room.id, 's1', '5');
    castVote(room.id, 's1', '8');
    expect(room.participants.get('s1').vote).toBe('8');
  });

  it('does not allow voting after reveal', () => {
    const room = createRoom('o1');
    addParticipant(room.id, 'o1', 'Dev');
    revealVotes(room.id, 'o1');
    castVote(room.id, 'o1', '5');
    expect(room.participants.get('o1').vote).toBeNull();
  });

  it('returns null for non-existent room', () => {
    expect(castVote('nope', 's1', '5')).toBeNull();
  });
});

describe('revealVotes', () => {
  it('sets phase to revealed', () => {
    const room = createRoom('o1');
    addParticipant(room.id, 'o1', 'Dev');
    revealVotes(room.id, 'o1');
    expect(room.phase).toBe('revealed');
  });

  it('only allows owner to reveal', () => {
    const room = createRoom('o1');
    addParticipant(room.id, 'o1', 'Dev');
    addParticipant(room.id, 's2', 'Dev');
    expect(revealVotes(room.id, 's2')).toBeNull();
    expect(room.phase).toBe('voting');
  });

  it('returns null for non-existent room', () => {
    expect(revealVotes('nope', 'o1')).toBeNull();
  });
});

describe('resetRoom', () => {
  it('resets phase and clears all votes', () => {
    const room = createRoom('o1');
    addParticipant(room.id, 'o1', 'Dev');
    addParticipant(room.id, 's2', 'Dev');
    castVote(room.id, 'o1', '5');
    castVote(room.id, 's2', '3');
    revealVotes(room.id, 'o1');
    resetRoom(room.id, 'o1');

    expect(room.phase).toBe('voting');
    for (const p of room.participants.values()) {
      expect(p.vote).toBeNull();
      expect(p.hasVoted).toBe(false);
    }
  });

  it('only allows owner to reset', () => {
    const room = createRoom('o1');
    addParticipant(room.id, 'o1', 'Dev');
    addParticipant(room.id, 's2', 'Dev');
    expect(resetRoom(room.id, 's2')).toBeNull();
  });
});

describe('sanitizeState', () => {
  it('hides votes during voting phase', () => {
    const room = createRoom('o1');
    addParticipant(room.id, 'o1', 'Dev');
    addParticipant(room.id, 's2', 'Product');
    castVote(room.id, 'o1', '5');

    const state = sanitizeState(room, 's2');
    expect(state.id).toBe(room.id);
    expect(state.ownerId).toBe('o1');
    expect(state.phase).toBe('voting');
    expect(state.you).toBe('s2');
    expect(state.participants).toHaveLength(2);

    const ownerState = state.participants.find((p) => p.id === 'o1');
    expect(ownerState.vote).toBeNull();
    expect(ownerState.hasVoted).toBe(true);
  });

  it('shows votes during revealed phase', () => {
    const room = createRoom('o1');
    addParticipant(room.id, 'o1', 'Dev');
    castVote(room.id, 'o1', '5');
    revealVotes(room.id, 'o1');

    const state = sanitizeState(room, 'o1');
    const ownerState = state.participants.find((p) => p.id === 'o1');
    expect(ownerState.vote).toBe('5');
  });

  it('includes ticketUrl in sanitized state', () => {
    const room = createRoom('o1');
    addParticipant(room.id, 'o1', 'Dev');
    setTicketUrl(room.id, 'o1', 'https://example.com/ticket/1');

    const state = sanitizeState(room, 'o1');
    expect(state.ticketUrl).toBe('https://example.com/ticket/1');
  });

  it('includes null ticketUrl when not set', () => {
    const room = createRoom('o1');
    addParticipant(room.id, 'o1', 'Dev');

    const state = sanitizeState(room, 'o1');
    expect(state.ticketUrl).toBeNull();
  });
});

describe('setTicketUrl', () => {
  it('sets the ticket URL when called by the owner', () => {
    const room = createRoom('o1');
    const url = 'https://example.com/ticket/1';
    const result = setTicketUrl(room.id, 'o1', url);
    expect(result.room).toBe(room);
    expect(room.ticketUrl).toBe(url);
  });

  it('returns not_found error for a non-existent room', () => {
    expect(setTicketUrl('nope', 'o1', 'https://example.com').error).toBe(
      'not_found',
    );
  });

  it('returns not_owner error when called by a non-owner', () => {
    const room = createRoom('o1');
    expect(
      setTicketUrl(room.id, 'not-owner', 'https://example.com').error,
    ).toBe('not_owner');
    expect(room.ticketUrl).toBeNull();
  });

  it('returns invalid_url error for a URL without http(s) prefix', () => {
    const room = createRoom('o1');
    expect(setTicketUrl(room.id, 'o1', 'ftp://example.com').error).toBe(
      'invalid_url',
    );
    expect(room.ticketUrl).toBeNull();
  });

  it('returns invalid_url error for a URL exceeding 2048 characters', () => {
    const room = createRoom('o1');
    const longUrl = 'https://example.com/' + 'a'.repeat(2048);
    expect(setTicketUrl(room.id, 'o1', longUrl).error).toBe('invalid_url');
    expect(room.ticketUrl).toBeNull();
  });

  it('clears the URL when called with an empty string', () => {
    const room = createRoom('o1');
    setTicketUrl(room.id, 'o1', 'https://example.com/ticket/1');
    const result = setTicketUrl(room.id, 'o1', '');
    expect(result.room).toBe(room);
    expect(room.ticketUrl).toBeNull();
  });

  it('accepts http:// URLs', () => {
    const room = createRoom('o1');
    expect(setTicketUrl(room.id, 'o1', 'http://example.com/ticket').room).toBe(
      room,
    );
    expect(room.ticketUrl).toBe('http://example.com/ticket');
  });
});

describe('resetRoom ticketUrl', () => {
  it('clears ticketUrl on reset', () => {
    const room = createRoom('o1');
    addParticipant(room.id, 'o1', 'Dev');
    setTicketUrl(room.id, 'o1', 'https://example.com/ticket/1');
    revealVotes(room.id, 'o1');
    resetRoom(room.id, 'o1');
    expect(room.ticketUrl).toBeNull();
  });
});
