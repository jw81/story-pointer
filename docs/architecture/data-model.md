# Data Model

All state lives in `server/roomManager.js` in a module-level `Map<roomId, Room>`. There is no database — rooms are lost when the server process restarts.

## Room

```js
{
  id:           string,           // 8-character nanoid (e.g. "aB3xZ9qW")
  ownerId:      string | null,    // socket.id of the current owner; null briefly at creation
  phase:        "voting" | "revealed",
  ticketUrl:    string | null,    // URL set by owner for the current round
  participants: Map<socketId, Participant>
}
```

- `ownerId` is set to the first participant's socket ID when they join via `addParticipant`.
- When the owner disconnects, ownership transfers to the next participant in insertion order.
- The room is deleted when the last participant leaves.

## Participant

```js
{
  id:          string,           // socket.id
  role:        string,           // "Dev" | "Product" | "UX" | "Other"
  displayName: string,           // auto-computed (see below)
  vote:        string | null,    // "1" | "2" | "3" | "5" | "8" | "?" | null
  hasVoted:    boolean           // true when a vote is set, false otherwise
}
```

### Display Name Computation

Display names are recomputed in `addParticipant` and `removeParticipant` every time the participant list changes:

| Scenario                             | Display name                    |
| ------------------------------------ | ------------------------------- |
| Only one participant with role "Dev" | `"Dev"`                         |
| Two participants with role "Dev"     | `"Dev 1"`, `"Dev 2"`            |
| Three participants with role "Dev"   | `"Dev 1"`, `"Dev 2"`, `"Dev 3"` |

Numbering follows insertion order. If "Dev 1" leaves, remaining participants are renumbered from 1.

## Sanitized State (sent to clients)

The server never sends raw room state. `sanitizeState(room, forSocketId)` transforms it into a client-safe object:

```js
{
  id:           string,          // room ID
  ownerId:      string,          // socket.id of owner
  phase:        "voting" | "revealed",
  ticketUrl:    string | null,
  participants: [                // Array (not Map) sorted by join order
    {
      id:          string,
      role:        string,
      displayName: string,
      hasVoted:    boolean,
      vote:        string | null   // null during "voting" phase (hidden); actual value during "revealed"
    }
  ],
  you:          string,          // socket.id of the receiving client
}
```

### Vote Visibility Rules

| Phase      | `vote` field sent to clients |
| ---------- | ---------------------------- |
| `voting`   | Always `null` (hidden)       |
| `revealed` | Actual vote value            |

The `hasVoted` flag is always accurate — clients can show a "voted" indicator without knowing the vote value.

## Phase Transitions

| Transition            | Triggered by                    | Effect                                                    |
| --------------------- | ------------------------------- | --------------------------------------------------------- |
| `voting` → `revealed` | `revealVotes(roomId, socketId)` | `phase = "revealed"`                                      |
| `revealed` → `voting` | `resetRoom(roomId, socketId)`   | `phase = "voting"`, all votes cleared, `ticketUrl = null` |

Both transitions require `socketId === room.ownerId`. Attempting either as a non-owner returns `null` (no-op).

## Ticket URL Validation

`setTicketUrl` accepts a URL string and validates:

- Must start with `http://` or `https://`
- Maximum 2048 characters

On failure, the socket handler emits `room:error` with a descriptive message. On success, the URL is stored and broadcast to all participants.
