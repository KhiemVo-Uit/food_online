import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Card, Alert, Spinner, Badge, Button, Row, Col } from 'react-bootstrap';
import api from '../services/api';
import { useSocket } from '../hooks/useSocket';
import OrderTrackingMap from '../components/OrderTrackingMap';

const statusColors = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  COOKING: 'primary',
  PICKING_UP: 'secondary',
  DELIVERING: 'info',
  DELIVERED: 'success',
  CANCELLED: 'danger',
};

function OrderTracking() {
  const { id } = useParams();
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [customerLocation, setCustomerLocation] = useState(null);
  
  const { isConnected, joinAsCustomer, onLocationUpdate, onOrderStatusUpdate, off } = useSocket();

  useEffect(() => {
    fetchTracking();
    // Get customer's current location
    getCurrentLocation();
  }, [id]);

  useEffect(() => {
    if (!isConnected || !tracking) return;

    // Get user ID from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.id) {
      console.log(`👤 [Customer] Joining tracking for order ${id}`);
      joinAsCustomer(user.id, id);
    }

    // Listen for real-time location updates
    const handleLocationUpdate = (data) => {
      console.log('📍 [Customer] Received location update:', {
        orderId: data.orderId,
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: data.timestamp
      });
      setTracking(prev => ({
        ...prev,
        shipper_location: {
          ...prev.shipper_location,
          latitude: data.latitude,
          longitude: data.longitude,
          updated_at: data.timestamp
        }
      }));
      setLastUpdate(data.timestamp);
    };

    // Listen for order status updates
    const handleStatusUpdate = (data) => {
      console.log('📦 [Customer] Status updated:', data);
      setTracking(prev => ({
        ...prev,
        status: data.status
      }));
    };

    onLocationUpdate(handleLocationUpdate);
    onOrderStatusUpdate(handleStatusUpdate);

    console.log('✅ [Customer] Location listeners registered');

    return () => {
      console.log('🔌 [Customer] Removing location listeners');
      off('location:updated', handleLocationUpdate);
      off('order:status:updated', handleStatusUpdate);
    };
  }, [isConnected, tracking?.order_id, id]);

  const fetchTracking = async () => {
    try {
      const response = await api.get(`/orders/${id}/location`);
      setTracking(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load tracking information');
      setLoading(false);
      console.error(err);
    }
  };

  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCustomerLocation({ latitude, longitude });
          
          // Send to backend
          try {
            await api.post(`/orders/${id}/customer-location`, {
              latitude,
              longitude
            });
            console.log('✅ Customer location sent to server');
          } catch (err) {
            console.error('Failed to update customer location:', err);
          }
        },
        (error) => {
          console.warn('Geolocation error:', error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      console.warn('Geolocation not supported');
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(2);
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (error || !tracking) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error || 'Tracking not available'}</Alert>
      </Container>
    );
  }

  const distance = tracking.shipper_location && tracking.restaurant_location
    ? calculateDistance(
        tracking.shipper_location.latitude,
        tracking.shipper_location.longitude,
        tracking.restaurant_location.latitude,
        tracking.restaurant_location.longitude
      )
    : null;

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Order Tracking #{tracking.order_id}</h1>
          <div className="mt-2">
            <Badge bg={isConnected ? 'success' : 'danger'} className="me-2">
              {isConnected ? '🟢 Real-time' : '🔴 Disconnected'}
            </Badge>
            <Badge bg={statusColors[tracking.status]}>
              {tracking.status}
            </Badge>
          </div>
        </div>
        <Button variant="outline-primary" size="sm" onClick={fetchTracking}>
          🔄 Refresh
        </Button>
      </div>

      {!tracking.shipper_location ? (
        <Alert variant="info">
          <h5>Chưa có shipper</h5>
          <p>Đơn hàng chưa được gán cho shipper. Vui lòng đợi...</p>
        </Alert>
      ) : (
        <>
          {/* Map View */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">🗺️ Bản đồ theo dõi</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <OrderTrackingMap 
                tracking={{
                  ...tracking,
                  customer_location: customerLocation || tracking.customer_location
                }} 
              />
            </Card.Body>
          </Card>

          <Row>
            <Col md={6}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">📍 Vị trí Shipper</h5>
                </Card.Header>
                <Card.Body>
                  <p className="mb-2">
                    <strong>Latitude:</strong> {tracking.shipper_location.latitude}
                  </p>
                  <p className="mb-2">
                    <strong>Longitude:</strong> {tracking.shipper_location.longitude}
                  </p>
                  <p className="mb-2">
                    <strong>Cập nhật:</strong>{' '}
                    {new Date(lastUpdate || tracking.shipper_location.updated_at).toLocaleTimeString('vi-VN')}
                    {lastUpdate && (
                      <Badge bg="success" className="ms-2">
                        Live
                      </Badge>
                    )}
                  </p>
                  {distance && (
                    <p className="mb-0">
                      <strong>Khoảng cách từ nhà hàng:</strong> {distance} km
                    </p>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">🍽️ Nhà hàng</h5>
                </Card.Header>
                <Card.Body>
                  <p className="mb-2">
                    <strong>Latitude:</strong> {tracking.restaurant_location.latitude}
                  </p>
                  <p className="mb-0">
                    <strong>Longitude:</strong> {tracking.restaurant_location.longitude}
                  </p>
                </Card.Body>
              </Card>

              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">📦 Địa chỉ giao hàng</h5>
                </Card.Header>
                <Card.Body>
                  <p className="mb-0">{tracking.delivery_address}</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {['PICKING_UP', 'DELIVERING'].includes(tracking.status) && (
            <Alert variant="success" className="mt-2">
              <strong>🔄 Live Tracking:</strong> Vị trí shipper đang được cập nhật real-time
            </Alert>
          )}
        </>
      )}
    </Container>
  );
}

export default OrderTracking;
