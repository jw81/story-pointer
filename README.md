# Story Pointer

Real-time story pointing (planning poker) for agile teams. A product manager creates a room, shares the link, everyone votes on story complexity, and the host reveals the results.

## Prerequisites

- Node.js 18+
- npm 7+ (for workspaces support)

## Setup

```bash
npm install
```

## Development

Starts both the Vite dev server (port 5173) and the Express API server (port 3001). Vite proxies `/api` and `/socket.io` requests to Express automatically.

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

## Production

Build the client and start the Express server, which serves both the API and the React app on a single port

```bash
npm run build
NODE_ENV=production npm start
```

Open http://localhost:3001 in your browser.

To use a custom port:

```bash
PORT=8080 NODE_ENV=production npm start
```

## Tests

```bash
npm test              # run all tests (server + client)
npm run test:server   # server tests only
npm run test:client   # client tests only
```

## Linting & Formatting

```bash
npm run lint          # ESLint
npm run format        # Prettier (write)
npm run format:check  # Prettier (check only)
```
