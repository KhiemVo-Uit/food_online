import { useState, useEffect } from 'react';
import { Container, Card, Button, Badge, Alert } from 'react-bootstrap';
import { useSocket } from '../hooks/useSocket';

function TestSocket() {
  const [testOrder] = useState({ id: 1 }); // Test order ID
  const [locationHistory, setLocationHistory] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  
  const { isConnected, joinAsShipper, joinAsCustomer, updateLocation, onLocationUpdate, off } = useSocket();

  useEffect(() => {
    // Join as customer to listen
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.id) {
      joinAsCustomer(user.id, testOrder.id);
    }

    // Listen for location updates
    const handleLocationUpdate = (data) => {
      console.log('🎯 Test received location:', data);
      setLocationHistory(prev => [{
        ...data,
        receivedAt: new Date().toISOString()
      }, ...prev].slice(0, 10)); // Keep last 10 updates
    };

    onLocationUpdate(handleLocationUpdate);

    return () => {
      off('location:updated', handleLocationUpdate);
    };
  }, [testOrder.id]);

  const sendTestLocation = () => {
    // Generate random location near Quy Nhon
    const lat = 13.7756672 + (Math.random() - 0.5) * 0.01;
    const lng = 109.2255744 + (Math.random() - 0.5) * 0.01;
    
    setCurrentLocation({ latitude: lat, longitude: lng });
    updateLocation(testOrder.id, lat, lng, 'DELIVERING');
    console.log('📤 Sent test location:', { lat, lng });
  };

  const getCurrentPos = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ latitude, longitude });
          updateLocation(testOrder.id, latitude, longitude, 'DELIVERING');
          console.log('📤 Sent real location:', { latitude, longitude });
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Không thể lấy vị trí GPS');
        }
      );
    }
  };

  return (
    <Container className="py-5">
      <h1 className="mb-4">🧪 WebSocket Test</h1>

      <Card className="mb-3">
        <Card.Header>
          <h5 className="mb-0">Connection Status</h5>
        </Card.Header>
        <Card.Body>
          <Badge bg={isConnected ? 'success' : 'danger'}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </Badge>
          {isConnected && (
            <p className="mt-2 mb-0">
              <small className="text-muted">
                Listening for order #{testOrder.id}
              </small>
            </p>
          )}
        </Card.Body>
      </Card>

      <Card className="mb-3">
        <Card.Header>
          <h5 className="mb-0">Send Test Location</h5>
        </Card.Header>
        <Card.Body>
          <div className="d-flex gap-2 mb-3">
            <Button onClick={sendTestLocation}>
              📍 Send Random Location
            </Button>
            <Button onClick={getCurrentPos} variant="primary">
              📱 Send My GPS
            </Button>
          </div>
          {currentLocation && (
            <Alert variant="info">
              <small>
                Last sent: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </small>
            </Alert>
          )}
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <h5 className="mb-0">Received Locations ({locationHistory.length})</h5>
        </Card.Header>
        <Card.Body>
          {locationHistory.length === 0 ? (
            <p className="text-muted">Chưa nhận location nào...</p>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {locationHistory.map((loc, idx) => (
                <div key={idx} className="border-bottom pb-2 mb-2">
                  <div className="d-flex justify-content-between">
                    <span>
                      <strong>#{loc.orderId}</strong>
                    </span>
                    <small className="text-muted">
                      {new Date(loc.receivedAt).toLocaleTimeString('vi-VN')}
                    </small>
                  </div>
                  <div>
                    📍 {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                  </div>
                  <small className="text-muted">
                    Status: {loc.status} • Timestamp: {new Date(loc.timestamp).toLocaleTimeString('vi-VN')}
                  </small>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default TestSocket;
