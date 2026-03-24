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
});
