// backend/server.js - Main server entry point
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
  process.exit(1);
});
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
// require('dotenv').config({ path: '../.env' }); // Replaced by config module
const config = require('./config');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const attendanceRoutes = require('./routes/attendance');
const leaveRoutes = require('./routes/leaves');
const reportRoutes = require('./routes/reports');

// Import middleware
const { authMiddleware } = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

// Import database
const db = require('./config/database');

// Initialize Express app
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: config.cors
});

const limiter = rateLimit(config.rateLimit);

// Middleware
app.set('trust proxy', 1); // Trust first proxy
app.use(helmet());
app.use(cors(config.cors));

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(config.uploads.path));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/attendance', authMiddleware, attendanceRoutes);
app.use('/api/leaves', authMiddleware, leaveRoutes);
app.use('/api/reports', authMiddleware, reportRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join_room', (userId) => {
    socket.join(`user_${userId}`);
  });

  socket.on('attendance_update', (data) => {
    socket.to(`user_${data.managerId}`).emit('new_attendance', data);
  });

  socket.on('leave_request', (data) => {
    socket.to(`user_${data.managerId}`).emit('new_leave_request', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use(errorHandler);

// Database sync and server start
const PORT = process.env.PORT || 5000;

db.authenticate()
  .then(() => {
    console.log('Database connection established successfully');
    return db.sync();
  })
  .then(() => {
    console.log('Database models synchronized');
    // Start server if not in test mode
    if (process.env.NODE_ENV !== 'test') {
      server.listen(config.port, () => {
        console.log(`Server running on port ${config.port}`);
        console.log(`WebSocket server running for client at ${config.cors.origins.join(', ')}`);
      });
    }
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

// Export for testing
module.exports = app;