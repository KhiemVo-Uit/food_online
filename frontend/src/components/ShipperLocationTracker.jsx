import { useState, useEffect, useRef } from 'react';
import { Card, Button, Badge, Alert } from 'react-bootstrap';
import { useSocket } from '../hooks/useSocket';
import api from '../services/api';

function ShipperLocationTracker({ order }) {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [error, setError] = useState('');
  const watchIdRef = useRef(null);
  
  const { isConnected, joinAsShipper, updateLocation } = useSocket();

  useEffect(() => {
    // Join socket room when component mounts
    if (isConnected && order) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) {
        joinAsShipper(user.id, order.id);
      }
    }
  }, [isConnected, order?.id]);

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Trình duyệt không hỗ trợ Geolocation');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };

    const successCallback = (position) => {
      const { latitude, longitude } = position.coords;
      const timestamp = new Date().toISOString();
      setCurrentLocation({ latitude, longitude, timestamp });
      setError('');

      console.log(`📍 Shipper location updated: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);

      // Update server via HTTP
      api.post(`/orders/${order.id}/location`, {
        latitude,
        longitude,
        status: order.status
      })
      .then(() => console.log('✅ Location sent to server via HTTP'))
      .catch(err => {
        console.error('❌ Failed to update location via HTTP:', err);
      });

      // Broadcast via WebSocket
      if (isConnected) {
        console.log(`📡 Broadcasting location via WebSocket for order ${order.id}`);
        updateLocation(order.id, latitude, longitude, order.status);
      } else {
        console.warn('⚠️ WebSocket not connected, location update sent via HTTP only');
      }
    };

    const errorCallback = (error) => {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          setError('Bạn đã từ chối quyền truy cập vị trí');
          break;
        case error.POSITION_UNAVAILABLE:
          setError('Không thể xác định vị trí');
          break;
        case error.TIMEOUT:
          setError('Yêu cầu vị trí timeout');
          break;
        default:
          setError('Lỗi không xác định');
      }
      setIsTracking(false);
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      successCallback,
      errorCallback,
      options
    );
    
    setIsTracking(true);
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsTracking(false);
    }
  };

  const updateLocationManually = async () => {
    if (!navigator.geolocation) {
      setError('Trình duyệt không hỗ trợ Geolocation');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });
        
        try {
          await api.post(`/orders/${order.id}/location`, {
            latitude,
            longitude,
            status: order.status
          });

          if (isConnected) {
            updateLocation(order.id, latitude, longitude, order.status);
          }

          setError('');
        } catch (err) {
          setError('Không thể cập nhật vị trí');
          console.error(err);
        }
      },
      (error) => {
        setError('Không thể lấy vị trí hiện tại');
        console.error(error);
      }
    );
  };

  useEffect(() => {
    // Auto-start tracking when order status is PICKING_UP or DELIVERING
    if (order && ['PICKING_UP', 'DELIVERING'].includes(order.status)) {
      if (!isTracking && watchIdRef.current === null) {
        console.log('🚴 Auto-starting GPS tracking for shipper');
        startTracking();
      }
    } else {
      if (isTracking) {
        console.log('⏹️ Stopping GPS tracking (order status changed)');
        stopTracking();
      }
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [order?.status, isTracking]);

  if (!order || !['PICKING_UP', 'DELIVERING'].includes(order.status)) {
    return null;
  }

  return (
    <Card className="mb-4 border-primary">
      <Card.Header className="bg-primary text-white">
        <h5 className="mb-0">📍 Tracking GPS</h5>
      </Card.Header>
      <Card.Body>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <Badge bg={isConnected ? 'success' : 'danger'} className="me-2">
              {isConnected ? '🟢 Real-time Connected' : '🔴 Disconnected'}
            </Badge>
            <Badge bg={isTracking ? 'success' : 'warning'}>
              {isTracking ? '📡 Tracking Active' : '⏸️ Tracking Paused'}
            </Badge>
          </div>
          {!isTracking ? (
            <Button 
              variant="success" 
              size="sm" 
              onClick={startTracking}
            >
              ▶️ Start Tracking
            </Button>
          ) : (
            <Button 
              variant="danger" 
              size="sm" 
              onClick={stopTracking}
            >
              ⏹️ Stop Tracking
            </Button>
          )}
        </div>

        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        {currentLocation && (
          <div className="mb-3">
            <p className="mb-1">
              <strong>Latitude:</strong> {currentLocation.latitude.toFixed(6)}
            </p>
            <p className="mb-1">
              <strong>Longitude:</strong> {currentLocation.longitude.toFixed(6)}
            </p>
            {currentLocation.timestamp && (
              <p className="mb-0">
                <small className="text-muted">
                  Cập nhật: {new Date(currentLocation.timestamp).toLocaleTimeString('vi-VN')}
                </small>
              </p>
            )}
          </div>
        )}

        <Button 
          variant="outline-primary" 
          size="sm" 
          onClick={updateLocationManually}
          className="w-100"
        >
          🔄 Update Location Now
        </Button>

        <div className="mt-3">
          <small className="text-muted">
            💡 Tracking tự động khi bạn đang {order.status === 'PICKING_UP' ? 'lấy hàng' : 'giao hàng'}
          </small>
        </div>
      </Card.Body>
    </Card>
  );
}

export default ShipperLocationTracker;
