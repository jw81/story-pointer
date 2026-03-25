# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (runs server on :3001 + Vite on :5173 concurrently)
npm run dev

# Run all tests (server + client)
npm test

# Run server tests only
npm run test --workspace=server

# Run client tests only
npm run test --workspace=client

# Run a single test file
npx vitest run server/roomManager.test.js
npx vitest run client/src/components/VotingCards.test.jsx

# Lint + format
npm run lint
npm run format

# Production build + start
npm run build
npm start
```

## Architecture

**Monorepo:** `server/` (Express + Socket.io) and `client/` (React 19 + Vite + React Router 7) as npm workspaces. All ESM modules (`"type": "module"` at root).

**Server (`server/`):**

- `index.js` — Express server (port 3001). Two REST endpoints (`POST /api/rooms`, `GET /api/rooms/:id`) plus Socket.io. Serves `client/dist` in production with SPA fallback.
- `roomManager.js` — All room logic: in-memory Map, participant lifecycle, vote toggling, phase transitions (voting → revealed → voting), ownership transfer, display name computation, and `sanitizeState()` (hides votes during voting phase).
- `socketHandlers.js` — Maps Socket.io events to roomManager calls and broadcasts full sanitized state to every socket in the room after every mutation (`broadcastState()`).

**Client (`client/src/`):**

- `socket.js` — Singleton Socket.io client with `autoConnect: false`; connected on demand.
- `hooks/useRoom.js` — Single source of truth for room state. Manages socket lifecycle, emits actions (`join`, `castVote`, `reveal`, `reset`), and exposes computed `isOwner`. Uses a `roomIdRef` to avoid stale closures in socket callbacks.
- `pages/RoomPage.jsx` — Three-stage flow: (1) verify room exists via REST, redirect if not; (2) show `<RoleSelector />` until role chosen; (3) render the voting room.
- `pages/HomePage.jsx` — Creates a room via `POST /api/rooms`, then navigates to it.

**Data flow:** Server holds all state. Every mutation triggers `broadcastState()` which sends a personalized `room:state` event to each participant (votes hidden from all during voting phase). Clients are stateless renderers.

**Room phases:** `voting` → `revealVotes()` → `revealed` → `resetRoom()` → `voting`. Only the owner can reveal or reset.

**Display names:** Computed dynamically in `roomManager.addParticipant` / `removeParticipant`. Single role instance = bare name ("Dev"); duplicates = numbered ("Dev 1", "Dev 2").

**Vote toggle:** Casting the same vote value twice unsets it (null). Voting is blocked in `revealed` phase.

## Testing Patterns

**Server tests** use Vitest with Node.js environment:

- `roomManager.test.js` — pure unit tests; `beforeEach` calls `clearAllRooms()`
- `socketHandlers.test.js` — integration tests with a real Socket.io server on an ephemeral port. Race condition fix: always `await waitForEvent(client, 'room:state')` for the join state before registering the next event listener.

**Client tests** use Vitest with jsdom + React Testing Library:

- Mock `../socket` (the singleton) and `react-router-dom` at the top of test files.
- Use `globalThis.fetch` (not `global.fetch`) to avoid ESLint `no-undef` with browser globals.
- `RoomPage.test.jsx` wraps with `<MemoryRouter>` + `<Routes>`.

## Dev Proxy

Vite proxies `/api` and `/socket.io` to `http://localhost:3001` so the client dev server needs no CORS configuration. In production, Express serves everything from a single port.

## Deployment

**Live URL:** storypointer.up.railway.app

**Platform:** Railway (project: `responsible-illumination`, service: `server`)

**How it works:** Single Node.js process. Railway runs `npm run build` (Vite compiles `client/dist/`), then `npm start`. With `NODE_ENV=production`, Express serves `client/dist/` as static files on the same port as the API and Socket.io.

**CI/CD:** `.github/workflows/ci.yml`

- Every push/PR to `main`: lint + test
- Push to `main` only: deploy to Railway via `railway up --detach --service server` (runs after lint+test passes)
- `RAILWAY_TOKEN` GitHub secret must be a **project token** (not an account token) from Railway → project settings → Tokens

**Railway configuration:**

- `nixpacks.toml` — overrides Nixpacks build phase to `npm run build` only (without this, Nixpacks runs `npm ci && npm run build` which causes an EBUSY error due to Docker cache mount conflicts)
- `railway.json` — sets start command and restart policy
- Root Directory in Railway service settings must be **empty** (repo root). If set to `server/`, Railway won't find `nixpacks.toml`, `railway.json`, or the root `package.json` build script.
- Runtime variable: `NODE_ENV=production` (set in Railway dashboard, not as a build variable — setting it at build time would skip devDependencies and break the Vite build)
- Port: Railway injects `PORT=8080`; the Railway domain networking must point to `8080`
