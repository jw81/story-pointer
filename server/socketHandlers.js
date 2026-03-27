import {
  addParticipant,
  removeParticipant,
  castVote,
  revealVotes,
  resetRoom,
  setTicketUrl,
  sanitizeState,
} from './roomManager.js';

export function registerSocketHandlers(io, socket) {
  let currentRoomId = null;

  socket.on('room:join', ({ roomId, role }) => {
    const room = addParticipant(roomId, socket.id, role);
    if (!room) {
      socket.emit('room:error', { message: 'Room not found' });
      return;
    }

    if (!room.ownerId) {
      room.ownerId = socket.id;
    }

    currentRoomId = roomId;
    socket.join(roomId);
    broadcastState(io, room);
  });

  socket.on('vote:cast', ({ roomId, value }) => {
    const room = castVote(roomId, socket.id, value);
    if (!room) {
      socket.emit('room:error', { message: 'Room not found' });
      return;
    }
    broadcastState(io, room);
  });

  socket.on('vote:reveal', ({ roomId }) => {
    const room = revealVotes(roomId, socket.id);
    if (!room) {
      socket.emit('room:error', { message: 'Only the room owner can reveal' });
      return;
    }
    broadcastState(io, room);
  });

  socket.on('room:reset', ({ roomId }) => {
    const room = resetRoom(roomId, socket.id);
    if (!room) {
      socket.emit('room:error', { message: 'Only the room owner can reset' });
      return;
    }
    broadcastState(io, room);
  });

  socket.on('ticket:set', ({ roomId, url }) => {
    const result = setTicketUrl(roomId, socket.id, url);
    if (result.error === 'not_owner') {
      socket.emit('room:error', {
        message: 'Only the room owner can set the ticket URL',
      });
      return;
    }
    if (result.error === 'invalid_url') {
      socket.emit('room:error', {
        message: 'Please enter a valid URL starting with http:// or https://',
      });
      return;
    }
    if (result.error) return;
    broadcastState(io, result.room);
  });

  socket.on('disconnect', () => {
    if (!currentRoomId) return;
    const room = removeParticipant(currentRoomId, socket.id);
    if (room) {
      broadcastState(io, room);
    }
  });
}

function broadcastState(io, room) {
  const sockets = io.sockets.adapter.rooms.get(room.id);
  if (!sockets) return;

  for (const socketId of sockets) {
    const state = sanitizeState(room, socketId);
    io.to(socketId).emit('room:state', state);
  }
}
