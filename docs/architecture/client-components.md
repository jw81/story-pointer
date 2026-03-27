# Client Components

The React client is a stateless renderer — all state lives on the server and is delivered via Socket.io. The `useRoom` hook is the single source of truth on the client side.

## Component Tree

```
App (BrowserRouter)
├── / → HomePage
└── /room/:roomId → RoomPage
    ├── [checking]     "Loading room..."
    ├── [not joined]   RoleSelector
    └── [joined]
        ├── Header
        ├── TicketUrl
        ├── VotingCards
        ├── ParticipantArea
        │   └── ParticipantCard (×N)
        └── ActionBar
```

---

## Pages

### `HomePage`

**File:** `client/src/pages/HomePage.jsx`

Renders a single "Start Planning" button. On click, calls `POST /api/rooms` and navigates to `/room/:roomId`.

**State:** `creating` boolean (shows "Creating..." while request is in flight).

---

### `RoomPage`

**File:** `client/src/pages/RoomPage.jsx`

Three-stage render based on room validation and join status:

| Stage      | Condition                              | Renders             |
| ---------- | -------------------------------------- | ------------------- |
| Checking   | Room existence not yet verified        | `"Loading room..."` |
| Not joined | Room exists, user hasn't picked a role | `<RoleSelector>`    |
| Joined     | User has joined the room               | Full voting UI      |

Uses `useRoom` hook for all state and actions. Redirects to `/` if the room does not exist.

---

## Hooks

### `useRoom(roomId)`

**File:** `client/src/hooks/useRoom.js`

Manages socket lifecycle and exposes room state + actions to page components.

**Returns:**

| Name                | Type             | Description                                    |
| ------------------- | ---------------- | ---------------------------------------------- |
| `roomState`         | `object \| null` | Full sanitized room state from server          |
| `error`             | `string \| null` | Last `room:error` message                      |
| `joined`            | `boolean`        | True after `join()` is called                  |
| `isOwner`           | `boolean`        | Derived: `roomState.ownerId === roomState.you` |
| `join(role)`        | `function`       | Connects socket, emits `room:join`             |
| `castVote(value)`   | `function`       | Emits `vote:cast`                              |
| `reveal()`          | `function`       | Emits `vote:reveal`                            |
| `reset()`           | `function`       | Emits `room:reset`                             |
| `setTicketUrl(url)` | `function`       | Emits `ticket:set`                             |

**Socket lifecycle:** Socket is connected on `join()` and disconnected + cleaned up on component unmount. A `roomIdRef` avoids stale closures in socket callbacks.

---

## Components

### `Header`

**File:** `client/src/components/Header.jsx`

**Props:** none (reads URL from `window.location`)

Displays the app title and a "Copy Link" button. Button shows "Copied!" for 2 seconds after click.

---

### `RoleSelector`

**File:** `client/src/components/RoleSelector.jsx`

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `onSelect` | `(role: string) => void` | Called when user picks a role |

Modal overlay with four role buttons: Dev, Product, UX, Other. Calls `onSelect(role)` which triggers `useRoom.join(role)`.

---

### `TicketUrl`

**File:** `client/src/components/TicketUrl.jsx`

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `ticketUrl` | `string \| null` | Current ticket URL |
| `isOwner` | `boolean` | Determines edit vs. read-only view |
| `onSetTicketUrl` | `(url: string) => void` | Called with new URL (owner only) |

**Owner view:** Text input. Submits on Enter or blur, but only if the value has changed. Uses `type="url"` for basic browser validation.

**Non-owner view:** Clickable link if a URL is set; hidden if `ticketUrl` is null.

---

### `VotingCards`

**File:** `client/src/components/VotingCards.jsx`

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `currentVote` | `string \| null` | Currently selected value (highlights that card) |
| `onVote` | `(value: string) => void` | Called on card click |
| `disabled` | `boolean` | True when `phase === "revealed"` |

Renders 6 cards: `['1', '2', '3', '5', '8', '?']`. The selected card is visually highlighted. All cards are disabled (non-interactive) during the revealed phase.

---

### `ParticipantArea`

**File:** `client/src/components/ParticipantArea.jsx`

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `participants` | `Participant[]` | Array from room state |
| `ownerId` | `string` | Socket ID of the owner |
| `you` | `string` | Socket ID of the current client |
| `phase` | `"voting" \| "revealed"` | Current room phase |

Container that maps participants to `<ParticipantCard>` components.

---

### `ParticipantCard`

**File:** `client/src/components/ParticipantCard.jsx`

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `participant` | `Participant` | Single participant from room state |
| `isOwner` | `boolean` | True if this participant is the room owner |
| `isYou` | `boolean` | True if this is the current client |
| `revealed` | `boolean` | True when `phase === "revealed"` |

**Card face states:**

| Phase      | `hasVoted` | Displays                           |
| ---------- | ---------- | ---------------------------------- |
| `voting`   | false      | Empty card back                    |
| `voting`   | true       | Checkmark (vote hidden)            |
| `revealed` | any        | Vote value (card flipped to front) |

Uses a CSS 3D flip animation to transition between back (voting) and front (revealed) faces. Highlighted with a distinct style when `isYou === true`. Shows "Host" badge if `isOwner === true`.

---

### `ActionBar`

**File:** `client/src/components/ActionBar.jsx`

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `phase` | `"voting" \| "revealed"` | Current room phase |
| `isOwner` | `boolean` | Determines which controls are shown |
| `onReveal` | `() => void` | Called when owner clicks "Reveal Votes" |
| `onReset` | `() => void` | Called when owner clicks "New Round" |

| Viewer    | Phase      | Renders               |
| --------- | ---------- | --------------------- |
| Owner     | `voting`   | "Reveal Votes" button |
| Owner     | `revealed` | "New Round" button    |
| Non-owner | any        | Waiting message       |
