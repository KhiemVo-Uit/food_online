# Food Online WebSocket Server

Real-time communication server using Socket.IO for tracking delivery orders.

## Features

- 🔄 Real-time location updates from shippers
- 📡 Live order status notifications
- 💬 Direct messaging between shipper and customer
- 🎯 Room-based communication per order

## Installation

```bash
cd websocket-server
npm install
```

## Usage

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

Server runs on port **8080** by default.

## Events

### Client → Server

#### `shipper:join`

Shipper joins order room

```javascript
socket.emit("shipper:join", {
  userId: 123,
  orderId: 456,
});
```

#### `customer:join`

Customer joins order room

```javascript
socket.emit("customer:join", {
  userId: 789,
  orderId: 456,
});
```

#### `location:update`

Shipper broadcasts location

```javascript
socket.emit("location:update", {
  orderId: 456,
  latitude: 10.762622,
  longitude: 106.660172,
  status: "DELIVERING",
});
```

#### `order:status:update`

Broadcast order status change

```javascript
socket.emit("order:status:update", {
  orderId: 456,
  status: "DELIVERED",
  message: "Order has been delivered",
});
```

#### `message:send`

Send message in order room

```javascript
socket.emit("message:send", {
  orderId: 456,
  from: "shipper",
  message: "I am 5 minutes away",
});
```

### Server → Client

#### `location:updated`

Receive location update

```javascript
socket.on("location:updated", (data) => {
  // data: { orderId, latitude, longitude, status, timestamp }
});
```

#### `order:status:updated`

Receive status update

```javascript
socket.on("order:status:updated", (data) => {
  // data: { orderId, status, message, timestamp }
});
```

#### `message:received`

Receive new message

```javascript
socket.on("message:received", (data) => {
  // data: { orderId, from, message, timestamp }
});
```

## Architecture

```
Client (Shipper) → Socket.IO → Server → Room (order:456)
                                      ↓
Client (Customer) ← Socket.IO ← Server
```

## Integration with Laravel Backend

The WebSocket server works alongside Laravel API:

1. **HTTP Requests**: Used for persistent data (saving location to database)
2. **WebSocket**: Used for real-time broadcasting to connected clients

Example flow:

```
Shipper → HTTP POST /orders/123/location → Laravel saves to DB
       → WebSocket emit → Server broadcasts → Customer receives instantly
```

## Frontend Integration

Install socket.io-client:

```bash
npm install socket.io-client
```

Use the `useSocket` hook:

```javascript
import { useSocket } from "../hooks/useSocket";

const { isConnected, joinAsCustomer, onLocationUpdate } = useSocket();

useEffect(() => {
  joinAsCustomer(userId, orderId);

  onLocationUpdate((data) => {
    console.log("New location:", data);
  });
}, []);
```

## Environment Variables

Create `.env` file (optional):

```
PORT=8080
```

## CORS Configuration

Default allowed origins:

- `http://localhost:3000`
- `http://localhost:5173`

Edit `server.js` to add more origins.

## Production Deployment

### Using PM2

```bash
npm install -g pm2
pm2 start server.js --name food-online-ws
pm2 save
pm2 startup
```

### Using Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8080
CMD ["node", "server.js"]
```

## Monitoring

Check active connections:

```javascript
io.engine.clientsCount; // Total connected clients
```

## Troubleshooting

### Connection Refused

- Check if server is running on port 8080
- Check firewall settings
- Verify CORS configuration

### Location Not Updating

- Check browser console for WebSocket errors
- Verify user has granted location permissions
- Check if order status is PICKING_UP or DELIVERING

### Real-time Badge Shows Disconnected

- Server may not be running
- Network issues
- Check browser DevTools → Network → WS tab

## License

MIT
