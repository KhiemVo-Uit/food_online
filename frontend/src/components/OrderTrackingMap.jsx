import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

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

// Component to handle routing
function RoutingControl({ waypoints }) {
  const map = useMap();
  const [routingControl, setRoutingControl] = useState(null);

  useEffect(() => {
    if (!map || waypoints.length < 2) return;

    // Remove existing routing control
    if (routingControl) {
      map.removeControl(routingControl);
    }

    // Create new routing control using OSRM (free routing service)
    const control = L.Routing.control({
      waypoints: waypoints.map(pos => L.latLng(pos[0], pos[1])),
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: false,
      showAlternatives: false,
      lineOptions: {
        styles: [{ color: '#3b82f6', opacity: 0.8, weight: 5 }]
      },
      createMarker: () => null, // Don't create default markers (we have custom ones)
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1',
        profile: 'driving' // Use driving profile for road routing
      }),
      show: false, // Hide directions panel completely
      containerClassName: 'd-none' // Hide the routing instructions container
    }).addTo(map);

    // Listen for route found event
    control.on('routesfound', function(e) {
      const routes = e.routes;
      const summary = routes[0].summary;
      console.log('🛣️ Route found:', {
        distance: (summary.totalDistance / 1000).toFixed(2) + ' km',
        time: Math.round(summary.totalTime / 60) + ' phút',
        waypoints: waypoints.length
      });
    });

    setRoutingControl(control);

    // Cleanup
    return () => {
      if (control) {
        map.removeControl(control);
      }
    };
  }, [map, waypoints]);

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

  // Create route waypoints for road routing
  const routeWaypoints = [];
  if (restaurantPos) routeWaypoints.push(restaurantPos);
  routeWaypoints.push(shipperPos);
  if (deliveryPos) routeWaypoints.push(deliveryPos);

  return (
    <div style={{ height: '500px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
      <MapContainer
        center={center}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
      >
        {/* Using CARTO Voyager - Better detail for Vietnam */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />
        
        {/* Alternative: Esri World Street Map - Very detailed
        <TileLayer
          attribution='Tiles &copy; Esri'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
        />
        */}
        
        {/* Alternative: Hybrid with Satellite imagery
        <TileLayer
          attribution='Tiles &copy; Esri'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
        />
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          opacity={0.5}
        />
        */}

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

        {/* Road-based Routing (OSRM - FREE) */}
        {routeWaypoints.length > 1 && (
          <RoutingControl waypoints={routeWaypoints} />
        )}
      </MapContainer>
    </div>
  );
}

export default OrderTrackingMap;
