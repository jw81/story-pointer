import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as clientIO } from 'socket.io-client';
import express from 'express';
import { registerSocketHandlers } from './socketHandlers.js';
import { createRoom, clearAllRooms } from './roomManager.js';

let httpServer, io, port;

function connectClient() {
  return clientIO(`http://localhost:${port}`, {
    transports: ['websocket'],
    forceNew: true,
  });
}

function waitForEvent(socket, event) {
  return new Promise((resolve) => {
    socket.once(event, resolve);
  });
}

beforeEach(async () => {
  clearAllRooms();
  const app = express();
  httpServer = createServer(app);
  io = new Server(httpServer, { cors: { origin: '*' } });
  io.on('connection', (socket) => registerSocketHandlers(io, socket));

  await new Promise((resolve) => {
    httpServer.listen(0, () => {
      port = httpServer.address().port;
      resolve();
    });
  });
});

afterEach(async () => {
  io.close();
  await new Promise((resolve) => httpServer.close(resolve));
});

describe('socket handlers', () => {
  it('joins a room and receives state', async () => {
    const room = createRoom(null);
    const client = connectClient();

    client.emit('room:join', { roomId: room.id, role: 'Dev' });
    const state = await waitForEvent(client, 'room:state');

    expect(state.id).toBe(room.id);
    expect(state.participants).toHaveLength(1);
    expect(state.participants[0].role).toBe('Dev');
    expect(state.participants[0].displayName).toBe('Dev');
    expect(state.ownerId).toBe(client.id);
    expect(state.you).toBe(client.id);

    client.close();
  });

  it('emits error for non-existent room', async () => {
    const client = connectClient();

    client.emit('room:join', { roomId: 'nonexist', role: 'Dev' });
    const error = await waitForEvent(client, 'room:error');

    expect(error.message).toBe('Room not found');
    client.close();
  });

  it('two clients see each other', async () => {
    const room = createRoom(null);
    const c1 = connectClient();
    const c2 = connectClient();

    c1.emit('room:join', { roomId: room.id, role: 'Dev' });
    await waitForEvent(c1, 'room:state');

    c2.emit('room:join', { roomId: room.id, role: 'Product' });
    const state = await waitForEvent(c1, 'room:state');

    expect(state.participants).toHaveLength(2);
    c1.close();
    c2.close();
  });

  it('vote flow: cast, reveal, reset', async () => {
    const room = createRoom(null);
    const c1 = connectClient();
    const c2 = connectClient();

    c1.emit('room:join', { roomId: room.id, role: 'Dev' });
    await waitForEvent(c1, 'room:state');

    c2.emit('room:join', { roomId: room.id, role: 'Product' });
    await waitForEvent(c2, 'room:state');

    // Cast votes
    const votePromise = waitForEvent(c2, 'room:state');
    c1.emit('vote:cast', { roomId: room.id, value: '5' });
    let state = await votePromise;
    const voter = state.participants.find((p) => p.id === c1.id);
    expect(voter.hasVoted).toBe(true);
    expect(voter.vote).toBeNull(); // hidden during voting

    // Reveal (c1 is owner)
    c1.emit('vote:reveal', { roomId: room.id });
    state = await waitForEvent(c2, 'room:state');
    expect(state.phase).toBe('revealed');
    const revealedVoter = state.participants.find((p) => p.id === c1.id);
    expect(revealedVoter.vote).toBe('5');

    // Reset
    c1.emit('room:reset', { roomId: room.id });
    state = await waitForEvent(c2, 'room:state');
    expect(state.phase).toBe('voting');
    for (const p of state.participants) {
      expect(p.hasVoted).toBe(false);
      expect(p.vote).toBeNull();
    }

    c1.close();
    c2.close();
  });

  it('ticket:set broadcasts ticketUrl to all clients', async () => {
    const room = createRoom(null);
    const c1 = connectClient();
    const c2 = connectClient();

    c1.emit('room:join', { roomId: room.id, role: 'Dev' });
    await waitForEvent(c1, 'room:state');

    c2.emit('room:join', { roomId: room.id, role: 'Product' });
    await waitForEvent(c2, 'room:state');

    const url = 'https://example.com/ticket/42';
    const c2StatePromise = waitForEvent(c2, 'room:state');
    c1.emit('ticket:set', { roomId: room.id, url });
    const state = await c2StatePromise;

    expect(state.ticketUrl).toBe(url);

    c1.close();
    c2.close();
  });

  it('ticket:set emits invalid_url error for a non-http(s) URL', async () => {
    const room = createRoom(null);
    const c1 = connectClient();

    c1.emit('room:join', { roomId: room.id, role: 'Dev' });
    await waitForEvent(c1, 'room:state');

    const errorPromise = waitForEvent(c1, 'room:error');
    c1.emit('ticket:set', { roomId: room.id, url: 'blah' });
    const error = await errorPromise;

    expect(error.message).toBe(
      'Please enter a valid URL starting with http:// or https://',
    );

    c1.close();
  });

  it('ticket:set emits not_owner error when called by a non-owner', async () => {
    const room = createRoom(null);
    const c1 = connectClient();
    const c2 = connectClient();

    c1.emit('room:join', { roomId: room.id, role: 'Dev' });
    await waitForEvent(c1, 'room:state');

    c2.emit('room:join', { roomId: room.id, role: 'Product' });
    await waitForEvent(c2, 'room:state');

    const errorPromise = waitForEvent(c2, 'room:error');
    c2.emit('ticket:set', { roomId: room.id, url: 'https://example.com' });
    const error = await errorPromise;

    expect(error.message).toBe('Only the room owner can set the ticket URL');

    c1.close();
    c2.close();
  });

  it('transfers ownership on disconnect', async () => {
    const room = createRoom(null);
    const c1 = connectClient();
    const c2 = connectClient();

    c1.emit('room:join', { roomId: room.id, role: 'Dev' });
    await waitForEvent(c1, 'room:state');

    c2.emit('room:join', { roomId: room.id, role: 'Product' });
    await waitForEvent(c2, 'room:state');

    c1.close();
    const state = await waitForEvent(c2, 'room:state');
    expect(state.ownerId).toBe(c2.id);
    expect(state.participants).toHaveLength(1);

    c2.close();
  });
});
