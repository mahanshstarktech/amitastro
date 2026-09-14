import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';
import { initDatabase, runQuery } from './db/database';
import apiRouter from './routes/api';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5001;
const CLIENT_URL = process.env.CLIENT_URL || '*';

// Socket.io for Realtime Chat
const io = new SocketIOServer(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST']
  }
});

// Middlewares
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check for Render & uptime monitors
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Nakshaktram API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api', apiRouter);

// WebSocket logic for real-time WhatsApp-style chat
io.on('connection', (socket) => {
  console.log(`[WebSocket] Client connected: ${socket.id}`);

  // Join a conversation room
  socket.on('join_conversation', (conversationId: string) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined room ${conversationId}`);
  });

  // Leave room
  socket.on('leave_conversation', (conversationId: string) => {
    socket.leave(conversationId);
  });

  // Typing indicator
  socket.on('typing', ({ conversationId, senderName, isTyping }) => {
    socket.to(conversationId).emit('user_typing', { senderName, isTyping });
  });

  // New message broadcast
  socket.on('send_message', async (data) => {
    const { conversationId, message } = data;
    // Broadcast to everyone in room except sender
    socket.to(conversationId).emit('receive_message', message);
    // Broadcast notification to admin room
    io.emit('admin_new_message', { conversationId, message });
  });

  // Message read receipt
  socket.on('mark_read', ({ conversationId, messageId }) => {
    socket.to(conversationId).emit('message_read', { messageId });
  });

  socket.on('disconnect', () => {
    console.log(`[WebSocket] Client disconnected: ${socket.id}`);
  });
});

// Initialize database and start server
initDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`
======================================================
✨ Nakshaktram Backend Running on port ${PORT}
✨ Health Check: http://localhost:${PORT}/health
✨ API Base URL: http://localhost:${PORT}/api
✨ Socket.io Active for Realtime WhatsApp-style Chat
======================================================
    `);
  });
}).catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
