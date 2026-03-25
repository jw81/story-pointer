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

## Deployment

The app is hosted on [Railway](https://railway.app).

### How it works

Railway builds the React client (`npm run build`) and starts the Express server (`npm start`). In production, the single Node.js process serves the API, WebSocket connections, and the compiled React app all on one port.

### CI/CD

Every push to `main` on GitHub triggers the CI/CD pipeline via GitHub Actions:

1. **Lint + Test** — runs ESLint, Prettier check, and all server/client tests
2. **Deploy** — if lint and tests pass, deploys to Railway automatically

Pull requests run lint + tests only; no deployment happens until the PR is merged to `main`.

### Environment variables

| Variable | Where | Value |
|---|---|---|
| `NODE_ENV` | Railway (runtime) | `production` |
| `PORT` | Railway (injected) | `8080` |
| `RAILWAY_TOKEN` | GitHub secret | Railway project token |

### Re-deploying manually

Trigger a new deployment without a code change:

```bash
railway up --detach --service server
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
