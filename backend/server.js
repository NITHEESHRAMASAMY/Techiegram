const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/db');
const User = require('./models/User');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  },
});

global.io = io;

// Socket.io JWT Authentication Middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication error: Token is required'));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkeytechiegram1234!');
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }
    socket.user = user;
    next();
  } catch (err) {
    return next(new Error('Authentication error: Token invalid'));
  }
});

// Socket.io Connection & Event Handling
io.on('connection', (socket) => {
  const userId = socket.user._id.toString();

  // Set user online
  User.findByIdAndUpdate(userId, { onlineStatus: 'online', lastSeen: Date.now() }).exec();
  socket.broadcast.emit('user_status_change', { userId, status: 'online' });

  // Join personal room for messages & notifications routing
  socket.join(userId);

  // Chat room join
  socket.on('join_chat', (room) => {
    socket.join(room);
  });

  // Typing indicators
  socket.on('typing', (room) => {
    socket.in(room).emit('typing', room);
  });
  socket.on('stop_typing', (room) => {
    socket.in(room).emit('stop_typing', room);
  });

  // Direct and Group message dispatch
  socket.on('new_message', (newMessageReceived) => {
    const chat = newMessageReceived.chat;
    if (!chat || !chat.users) return;

    chat.users.forEach((usr) => {
      const targetId = usr._id || usr;
      if (targetId.toString() === newMessageReceived.sender._id.toString()) return;
      socket.in(targetId.toString()).emit('message_received', newMessageReceived);
    });
  });

  // Read receipts
  socket.on('message_read', ({ chatId, userId }) => {
    socket.in(chatId).emit('message_read', { chatId, userId });
  });

  socket.on('disconnect', () => {
    User.findByIdAndUpdate(userId, { onlineStatus: 'offline', lastSeen: Date.now() }).exec();
    socket.broadcast.emit('user_status_change', { userId, status: 'offline', lastSeen: new Date() });
    socket.leave(userId);
  });
});

// Standard Middlewares
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Uploads
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));

// New Phase 2 Routes
app.use('/api/chats', require('./routes/chatRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/communities', require('./routes/communityRoutes'));
app.use('/api/mentors', require('./routes/mentorRoutes'));
app.use('/api/bookmarks', require('./routes/bookmarkRoutes'));

// New Phase 4 Routes
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/assessments', require('./routes/assessmentRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// Welcome route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Techiegram API!' });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
