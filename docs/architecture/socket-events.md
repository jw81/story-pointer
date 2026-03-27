# Socket.io Event Reference

All real-time communication happens over a single Socket.io connection per participant. The client connects lazily — the socket is created with `autoConnect: false` and connected explicitly when the user joins a room.

## Events: Client → Server

### `room:join`

Join a room with a chosen role. Triggers ownership assignment if the room has no owner yet.

```js
// Payload
{ roomId: string, role: string }

// Side effects
// - Adds participant to room (addParticipant)
// - Sets ownerId if room has none
// - broadcastState() to all participants
```

### `vote:cast`

Cast or toggle a vote. Sending the same value twice clears the vote.

```js
// Payload
{ roomId: string, value: string }  // value: "1" | "2" | "3" | "5" | "8" | "?"

// Side effects
// - Toggles vote: same value → null; different value → replaces
// - No-op if phase === "revealed"
// - broadcastState() to all participants
```

### `vote:reveal`

Reveal all votes. Owner only.

```js
// Payload
{
  roomId: string;
}

// Side effects (owner only)
// - Sets phase = "revealed"
// - broadcastState() to all participants
// - Ignored silently if not owner
```

### `room:reset`

Start a new round. Clears all votes and the ticket URL. Owner only.

```js
// Payload
{
  roomId: string;
}

// Side effects (owner only)
// - Sets phase = "voting"
// - Clears all participant votes (vote = null, hasVoted = false)
// - Clears ticketUrl
// - broadcastState() to all participants
// - Ignored silently if not owner
```

### `ticket:set`

Set the ticket URL for the current round. Owner only.

```js
// Payload
{ roomId: string, url: string }

// Side effects (owner only)
// - Validates URL (must start with http:// or https://, max 2048 chars)
// - On success: stores URL, broadcastState() to all participants
// - On failure: emits room:error to the sender only
// - Ignored silently if not owner
```

### `disconnect` (implicit)

Fired automatically by Socket.io when the connection drops.

```js
// No payload

// Side effects
// - Removes participant from room
// - Transfers ownership to next participant if disconnected was owner
// - Deletes room if it becomes empty
// - broadcastState() to remaining participants (if any)
```

---

## Events: Server → Client

### `room:state`

Sent to every participant after any mutation. Each client receives a personalized copy with votes hidden during the voting phase.

```js
// Payload
{
  id:           string,
  ownerId:      string,
  phase:        "voting" | "revealed",
  ticketUrl:    string | null,
  participants: Array<{
    id:          string,
    role:        string,
    displayName: string,
    hasVoted:    boolean,
    vote:        string | null   // null during "voting" phase
  }>,
  you:          string           // socket.id of this recipient
}
```

The `you` field lets each client identify themselves and derive `isOwner` (`ownerId === you`).

### `room:error`

Sent only to the socket that triggered the error.

```js
// Payload
{
  message: string;
}

// Sent when:
// - ticket:set payload fails URL validation
// - Any event references a room that does not exist
```

---

## Broadcasting Logic

`broadcastState(io, room)` in `socketHandlers.js`:

1. Iterates over all participants in the room
2. Calls `sanitizeState(room, participantId)` for each one
3. Emits `room:state` to that specific socket ID

This ensures each client sees the correct view of state (e.g., their own votes are always included in sanitized state even though others cannot see them — though currently all votes are hidden equally).
