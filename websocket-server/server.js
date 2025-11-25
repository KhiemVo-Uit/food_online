const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST']
  }
});

// Store active connections by user ID
const connections = new Map();

// Store user socket mappings
const userSockets = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // User registers their connection
  socket.on('user:register', async (data) => {
    const { userId } = data;
    socket.join(`user:${userId}`);
    userSockets.set(userId, socket.id);
    console.log(`✅ User ${userId} registered with socket ${socket.id}`);
    
    // Emit confirmation back to client
    socket.emit('user:registered', { userId, socketId: socket.id, timestamp: new Date().toISOString() });
  });

  // Shipper joins their room
  socket.on('shipper:join', (data, ack) => {
    const { userId, orderId } = data || {};
    socket.join(`shipper:${userId}`);
    socket.join(`user:${userId}`);
    socket.join(`order:${orderId}`);
    connections.set(userId, { socketId: socket.id, orderId, role: 'shipper' });
    userSockets.set(userId, socket.id);
    console.log(`🚴 Shipper ${userId} joined order ${orderId} (socket ${socket.id})`);

    // Acknowledge back to client for debugging
    try {
      if (typeof ack === 'function') ack({ ok: true, joined: `order:${orderId}` });
      socket.emit('shipper:joined', { userId, orderId, socketId: socket.id, timestamp: new Date().toISOString() });
    } catch (e) {
      console.warn('⚠️ Ack failed for shipper:join', e);
    }
  });

  // Customer joins order room
  socket.on('customer:join', (data, ack) => {
    const { userId, orderId } = data || {};
    socket.join(`customer:${userId}`);
    socket.join(`user:${userId}`);
    socket.join(`order:${orderId}`);
    connections.set(userId, { socketId: socket.id, orderId, role: 'customer' });
    userSockets.set(userId, socket.id);
    console.log(`👤 Customer ${userId} joined order ${orderId} (socket ${socket.id})`);

    // Acknowledge back to client for debugging
    try {
      if (typeof ack === 'function') ack({ ok: true, joined: `order:${orderId}` });
      socket.emit('customer:joined', { userId, orderId, socketId: socket.id, timestamp: new Date().toISOString() });
    } catch (e) {
      console.warn('⚠️ Ack failed for customer:join', e);
    }
  });

  // Shipper updates location
  socket.on('location:update', (data) => {
    const { orderId, latitude, longitude, status } = data;
    console.log(`📍 Location update for order ${orderId}:`, { latitude, longitude, status });
    
    // Broadcast to all clients watching this order (except sender)
    socket.to(`order:${orderId}`).emit('location:updated', {
      orderId,
      latitude,
      longitude,
      status,
      timestamp: new Date().toISOString()
    });
  });

  // Order status updated
  socket.on('order:status:update', (data) => {
    const { orderId, status, message } = data;
    console.log(`Order ${orderId} status changed to ${status}`);
    
    // Broadcast to all clients watching this order
    io.to(`order:${orderId}`).emit('order:status:updated', {
      orderId,
      status,
      message,
      timestamp: new Date().toISOString()
    });
  });

  // Message between shipper and customer
  socket.on('message:send', (data) => {
    const { orderId, from, message } = data;
    console.log(`Message in order ${orderId} from ${from}:`, message);
    
    // Broadcast to all in order room except sender
    socket.to(`order:${orderId}`).emit('message:received', {
      orderId,
      from,
      message,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    // Remove from connections
    for (const [userId, data] of connections.entries()) {
      if (data.socketId === socket.id) {
        connections.delete(userId);
        userSockets.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});

// Serve test page
app.get('/test', (req, res) => {
  res.sendFile(__dirname + '/test.html');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    connections: connections.size,
    userSockets: userSockets.size,
    timestamp: new Date().toISOString()
  });
});

// HTTP API endpoints for Laravel to push notifications
app.post('/api/notify', (req, res) => {
  const { user_id, notification } = req.body;
  const socketId = userSockets.get(user_id);
  
  if (socketId) {
    console.log(`🔔 Sending notification to user ${user_id} (socket ${socketId}):`, notification.type || notification.title);
    io.to(`user:${user_id}`).emit('notification:new', notification);
    res.json({ success: true, delivered: true, socketId });
  } else {
    console.log(`⚠️ User ${user_id} not connected - notification saved to DB only`);
    res.json({ success: true, delivered: false, message: 'User not connected' });
  }
});

app.post('/api/order-status', (req, res) => {
  const { order_id, status, message } = req.body;
  console.log(`📦 Broadcasting order status: Order ${order_id} -> ${status}`);
  
  io.to(`order:${order_id}`).emit('order:status:updated', {
    orderId: order_id,
    status,
    message,
    timestamp: new Date().toISOString()
  });
  
  res.json({ success: true });
});

app.post('/api/location', (req, res) => {
  const { order_id, latitude, longitude, status } = req.body;
  console.log(`📍 HTTP: Broadcasting location for order ${order_id}`);
  
  io.to(`order:${order_id}`).emit('location:updated', {
    orderId: order_id,
    latitude,
    longitude,
    status,
    timestamp: new Date().toISOString()
  });
  
  res.json({ success: true });
});

app.post('/api/customer-location', (req, res) => {
  const { order_id, latitude, longitude } = req.body;
  console.log(`👤 HTTP: Broadcasting customer location for order ${order_id}`);
  
  io.to(`order:${order_id}`).emit('customer:location:updated', {
    orderId: order_id,
    latitude,
    longitude,
    timestamp: new Date().toISOString()
  });
  
  res.json({ success: true });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`\n🚀 WebSocket server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test page: http://localhost:${PORT}/test\n`);
});
