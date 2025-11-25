import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const shipperIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const restaurantIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const deliveryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to update map view when positions change
function MapUpdater({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
}

function OrderTrackingMap({ tracking }) {
  if (!tracking || !tracking.shipper_location) {
    return (
      <div className="alert alert-info">
        <p className="mb-0">📍 Chưa có thông tin vị trí shipper</p>
      </div>
    );
  }

  // Defensive parsing: ensure lat/lng are numbers (API sometimes returns strings)
  const shipperLat = parseFloat(tracking.shipper_location.latitude);
  const shipperLng = parseFloat(tracking.shipper_location.longitude);
  const shipperPos = [shipperLat, shipperLng];

  const restaurantPos = tracking.restaurant_location ? [
    parseFloat(tracking.restaurant_location.latitude),
    parseFloat(tracking.restaurant_location.longitude)
  ] : null;

  // Parse customer location (real GPS coordinates)
  const deliveryPos = tracking.customer_location?.latitude && tracking.customer_location?.longitude ? [
    parseFloat(tracking.customer_location.latitude),
    parseFloat(tracking.customer_location.longitude)
  ] : null;

  // Debug logging
  console.log('OrderTrackingMap data:', {
    customer_location: tracking.customer_location,
    deliveryPos,
    shipperPos,
    restaurantPos
  });

  // Calculate center of map (shipper position)
  const center = shipperPos;

  // Validate coordinates before rendering map
  const coordsValid = (
    Array.isArray(center) &&
    center.length === 2 &&
    Number.isFinite(center[0]) &&
    Number.isFinite(center[1]) &&
    Math.abs(center[0]) <= 90 &&
    Math.abs(center[1]) <= 180
  );

  if (!coordsValid) {
    // Provide a clear UI message and console info to help debugging
    console.error('Invalid coordinates for OrderTrackingMap:', {
      tracking,
      shipperPos,
      restaurantPos,
      deliveryPos
    });

    return (
      <div className="alert alert-warning p-3">
        <p className="mb-0">⚠️ Bản đồ không thể hiển thị vì tọa độ không hợp lệ.</p>
        <small className="text-muted">Kiểm tra console để biết thông tin chi tiết.</small>
      </div>
    );
  }

  // Create route line
  const routePositions = [];
  if (restaurantPos) routePositions.push(restaurantPos);
  routePositions.push(shipperPos);
  if (deliveryPos) routePositions.push(deliveryPos);

  return (
    <div style={{ height: '500px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
      <MapContainer
        center={center}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapUpdater center={center} zoom={14} />

        {/* Shipper Marker */}
        <Marker position={shipperPos} icon={shipperIcon}>
          <Popup>
            <strong>🚴 Shipper</strong><br />
            Vị trí hiện tại<br />
            <small>Cập nhật: {new Date(tracking.shipper_location.updated_at).toLocaleTimeString('vi-VN')}</small>
          </Popup>
        </Marker>

        {/* Restaurant Marker */}
        {restaurantPos && (
          <Marker position={restaurantPos} icon={restaurantIcon}>
            <Popup>
              <strong>🍽️ Nhà hàng</strong><br />
              {tracking.restaurant_location.name || 'Restaurant'}
            </Popup>
          </Marker>
        )}

        {/* Delivery Address Marker */}
        {deliveryPos && (
          <Marker position={deliveryPos} icon={deliveryIcon}>
            <Popup>
              <strong>📦 Địa chỉ giao hàng</strong><br />
              {tracking.delivery_address}
            </Popup>
          </Marker>
        )}

        {/* Route Line */}
        {routePositions.length > 1 && (
          <Polyline
            positions={routePositions}
            color="blue"
            weight={3}
            opacity={0.7}
            dashArray="10, 10"
          />
        )}
      </MapContainer>
    </div>
  );
}

export default OrderTrackingMap;
