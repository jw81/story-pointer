import { nanoid } from 'nanoid';

const rooms = new Map();

export function createRoom(ownerId) {
  const id = nanoid(8);
  const room = {
    id,
    ownerId,
    phase: 'voting',
    ticketUrl: null,
    participants: new Map(),
  };
  rooms.set(id, room);
  return room;
}

export function getRoom(roomId) {
  return rooms.get(roomId) || null;
}

export function roomExists(roomId) {
  return rooms.has(roomId);
}

export function deleteRoom(roomId) {
  rooms.delete(roomId);
}

export function addParticipant(roomId, socketId, role) {
  const room = rooms.get(roomId);
  if (!room) return null;

  room.participants.set(socketId, {
    id: socketId,
    role,
    displayName: '',
    vote: null,
    hasVoted: false,
  });

  recomputeDisplayNames(room);
  return room;
}

export function removeParticipant(roomId, socketId) {
  const room = rooms.get(roomId);
  if (!room) return null;

  room.participants.delete(socketId);

  if (room.participants.size === 0) {
    rooms.delete(roomId);
    return null;
  }

  if (room.ownerId === socketId) {
    const nextParticipant = room.participants.keys().next().value;
    room.ownerId = nextParticipant;
  }

  recomputeDisplayNames(room);
  return room;
}

export function castVote(roomId, socketId, value) {
  const room = rooms.get(roomId);
  if (!room) return null;
  if (room.phase !== 'voting') return room;

  const participant = room.participants.get(socketId);
  if (!participant) return null;

  if (participant.vote === value) {
    participant.vote = null;
    participant.hasVoted = false;
  } else {
    participant.vote = value;
    participant.hasVoted = true;
  }

  return room;
}

export function revealVotes(roomId, socketId) {
  const room = rooms.get(roomId);
  if (!room) return null;
  if (room.ownerId !== socketId) return null;
  if (room.phase !== 'voting') return room;

  room.phase = 'revealed';
  return room;
}

export function resetRoom(roomId, socketId) {
  const room = rooms.get(roomId);
  if (!room) return null;
  if (room.ownerId !== socketId) return null;

  room.phase = 'voting';
  room.ticketUrl = null;
  for (const participant of room.participants.values()) {
    participant.vote = null;
    participant.hasVoted = false;
  }

  return room;
}

export function setTicketUrl(roomId, socketId, url) {
  const room = rooms.get(roomId);
  if (!room) return { error: 'not_found' };
  if (room.ownerId !== socketId) return { error: 'not_owner' };

  const trimmed = (url ?? '').trim();
  if (
    trimmed !== '' &&
    (!/^https?:\/\//i.test(trimmed) || trimmed.length > 2048)
  ) {
    return { error: 'invalid_url' };
  }

  room.ticketUrl = trimmed === '' ? null : trimmed;
  return { room };
}

export function sanitizeState(room, forSocketId) {
  const participants = [];
  for (const p of room.participants.values()) {
    participants.push({
      id: p.id,
      role: p.role,
      displayName: p.displayName,
      hasVoted: p.hasVoted,
      vote: room.phase === 'revealed' ? p.vote : null,
    });
  }

  return {
    id: room.id,
    ownerId: room.ownerId,
    phase: room.phase,
    ticketUrl: room.ticketUrl,
    participants,
    you: forSocketId,
  };
}

function recomputeDisplayNames(room) {
  const roleCounts = {};
  for (const p of room.participants.values()) {
    roleCounts[p.role] = (roleCounts[p.role] || 0) + 1;
  }

  const roleIndex = {};
  for (const p of room.participants.values()) {
    if (roleCounts[p.role] === 1) {
      p.displayName = p.role;
    } else {
      roleIndex[p.role] = (roleIndex[p.role] || 0) + 1;
      p.displayName = `${p.role} ${roleIndex[p.role]}`;
    }
  }
}

export function clearAllRooms() {
  rooms.clear();
}
