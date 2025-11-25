import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import Cookies from 'js-cookie';

const SOCKET_URL = 'http://localhost:8080';

// Singleton socket instance - shared across all components
let socket = null;
let isInitialized = false;

const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
      path: '/socket.io/'
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      
      // Auto-register user when connected
      const userCookie = Cookies.get('user');
      if (userCookie) {
        const user = JSON.parse(userCookie);
        if (user.id) {
          socket.emit('user:register', { userId: user.id });
          console.log('User registered:', user.id);
        } else {
          console.warn('⚠️ User cookie exists but no user.id');
        }
      } else {
        console.warn('⚠️ No user cookie found - user not logged in');
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socket.on('user:registered', (data) => {
      console.log('✅ Server confirmed user registration:', data);
    });

    isInitialized = true;
  }
  return socket;
};

// Helper to register user manually (called after login)
export const registerUser = () => {
  const currentSocket = getSocket();
  if (currentSocket && currentSocket.connected) {
    const userCookie = Cookies.get('user');
    if (userCookie) {
      const user = JSON.parse(userCookie);
      if (user.id) {
        currentSocket.emit('user:register', { userId: user.id });
        console.log('Manual user registration:', user.id);
      }
    }
  }
};

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const currentSocket = getSocket();

    const handleConnect = () => {
      setIsConnected(true);
      // Re-register user on reconnect
      registerUser();
    };
    const handleDisconnect = () => setIsConnected(false);

    currentSocket.on('connect', handleConnect);
    currentSocket.on('disconnect', handleDisconnect);
    
    // Set initial state
    setIsConnected(currentSocket.connected);

    // Register user if already connected
    if (currentSocket.connected) {
      registerUser();
    }

    // Cleanup listeners on unmount (but don't disconnect socket)
    return () => {
      currentSocket.off('connect', handleConnect);
      currentSocket.off('disconnect', handleDisconnect);
    };
  }, []);

  const joinAsShipper = (userId, orderId) => {
    const currentSocket = getSocket();
    if (currentSocket) {
      // provide ack callback to receive server acknowledgement
      currentSocket.emit('shipper:join', { userId, orderId }, (resp) => {
        console.log('shipper:join ack:', resp);
      });
    }
  };

  const joinAsCustomer = (userId, orderId) => {
    const currentSocket = getSocket();
    if (currentSocket) {
      currentSocket.emit('customer:join', { userId, orderId }, (resp) => {
        console.log('customer:join ack:', resp);
      });
    }
  };

  const updateLocation = (orderId, latitude, longitude, status) => {
    const currentSocket = getSocket();
    if (currentSocket) {
      currentSocket.emit('location:update', {
        orderId,
        latitude,
        longitude,
        status
      });
    }
  };

  const updateOrderStatus = (orderId, status, message) => {
    const currentSocket = getSocket();
    if (currentSocket) {
      currentSocket.emit('order:status:update', {
        orderId,
        status,
        message
      });
    }
  };

  const sendMessage = (orderId, from, message) => {
    const currentSocket = getSocket();
    if (currentSocket) {
      currentSocket.emit('message:send', {
        orderId,
        from,
        message
      });
    }
  };

  const onLocationUpdate = (callback) => {
    const currentSocket = getSocket();
    if (currentSocket) {
      currentSocket.on('location:updated', callback);
    }
  };

  // Listen for server join confirmations for debugging
  const socket = getSocket();
  socket.on('shipper:joined', (data) => {
    console.log('Server confirmed shipper joined:', data);
  });
  socket.on('customer:joined', (data) => {
    console.log('Server confirmed customer joined:', data);
  });

  const onOrderStatusUpdate = (callback) => {
    const currentSocket = getSocket();
    if (currentSocket) {
      currentSocket.on('order:status:updated', callback);
    }
  };

  const onMessageReceived = (callback) => {
    const currentSocket = getSocket();
    if (currentSocket) {
      currentSocket.on('message:received', callback);
    }
  };

  const onNotification = (callback) => {
    const currentSocket = getSocket();
    if (currentSocket) {
      currentSocket.on('notification:new', callback);
    }
  };

  const off = (event, callback) => {
    const currentSocket = getSocket();
    if (currentSocket) {
      currentSocket.off(event, callback);
    }
  };

  return {
    socket: getSocket(),
    isConnected,
    joinAsShipper,
    joinAsCustomer,
    updateLocation,
    updateOrderStatus,
    sendMessage,
    onLocationUpdate,
    onOrderStatusUpdate,
    onMessageReceived,
    onNotification,
    off
  };
};
