# REST API Reference

The server exposes two REST endpoints for room lifecycle management. All real-time interaction (voting, revealing, etc.) is handled via Socket.io — see [socket-events.md](socket-events.md).

Base URL: `http://localhost:3001` in development, the Railway domain in production.

---

## POST /api/rooms

Create a new room.

**Request**

No body required.

```
POST /api/rooms
```

**Response `200 OK`**

```json
{ "roomId": "aB3xZ9qW" }
```

`roomId` is an 8-character alphanumeric string (nanoid). Use it to construct the room URL: `/room/:roomId`.

**Notes**

- The room is created with `phase: "voting"` and no participants.
- The first participant to emit `room:join` becomes the owner.

---

## GET /api/rooms/:id

Check whether a room exists.

**Request**

```
GET /api/rooms/aB3xZ9qW
```

**Response `200 OK`**

```json
{ "exists": true }
```

or

```json
{ "exists": false }
```

**Notes**

- Always returns `200` — the `exists` boolean carries the result.
- The client uses this to redirect away from stale/invalid room URLs before attempting to join.
- Does not create a room if it does not exist.
