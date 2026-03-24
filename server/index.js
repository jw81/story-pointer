import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRoom, roomExists } from './roomManager.js';
import { registerSocketHandlers } from './socketHandlers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173',
  },
});

app.use(cors());
app.use(express.json());

// REST routes
app.post('/api/rooms', (req, res) => {
  const room = createRoom(null);
  res.json({ roomId: room.id });
});

app.get('/api/rooms/:id', (req, res) => {
  if (roomExists(req.params.id)) {
    res.json({ exists: true });
  } else {
    res.status(404).json({ exists: false });
  }
});

// Socket.io
io.on('connection', (socket) => {
  registerSocketHandlers(io, socket);
});

// Production: serve React build
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('{*splat}', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app, server, io };
