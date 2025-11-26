import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services';
import { toast } from 'react-toastify';
import { OpenLocationCode } from 'open-location-code';

// Initialize OpenLocationCode instance
const olc = new OpenLocationCode();

const checkoutSchema = Yup.object().shape({
  delivery_address: Yup.string().required('Delivery address is required'),
  customer_phone: Yup.string().required('Phone number is required'),
  payment_method: Yup.string().required('Payment method is required'),
  notes: Yup.string(),
});

function Checkout() {
  const navigate = useNavigate();
  const { cart, restaurant, clearCart, getCartTotal } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customerLocation, setCustomerLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  const deliveryFee = 20000;
  const subtotal = getCartTotal();
  const total = subtotal + deliveryFee;

  // Geocode address to GPS coordinates using Nominatim (OpenStreetMap)
  const geocodeAddress = async (address) => {
    if (!address || address.length < 5) {
      toast.info('Vui lòng nhập địa chỉ chi tiết hoặc dùng GPS hiện tại');
      return;
    }
    
    setLocationLoading(true);
    try {
      // Check if address contains Plus Code (e.g., F495+C5F)
      const plusCodeRegex = /[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,3}/;
      const plusCodeMatch = address.match(plusCodeRegex);
      
      if (plusCodeMatch) {
        const plusCode = plusCodeMatch[0];
        console.log('🔍 Detected Plus Code:', plusCode);
        console.log('📝 Original address (will be kept):', address);
        
        try {
          // Extract text part for reference location (but keep original address intact)
          let textPart = address.replace(plusCodeRegex, '').trim();
          textPart = textPart.replace(/^[,\s]+/, '').trim();
          
          let decodedCoords = null;
          
          if (olc.isFull(plusCode)) {
            // Full Plus Code, decode trực tiếp
            const codeArea = olc.decode(plusCode);
            decodedCoords = {
              latitude: codeArea.latitudeCenter,
              longitude: codeArea.longitudeCenter
            };
            console.log('✅ Decoded full Plus Code:', decodedCoords);
          } else if (olc.isShort(plusCode)) {
            // Short Plus Code, cần reference location
            // Try to geocode the text part first to get reference
            if (textPart.length > 3) {
              // Try multiple queries - PRIORITIZE Province (most reliable)
              const queries = [];
              
              // Remove "Việt Nam" or "Vietnam" from end to avoid duplication
              let cleanText = textPart
                .replace(/,?\s*(Việt Nam|Vietnam)\s*$/i, '')
                .trim();
              
              // Extract district/province parts
              const parts = cleanText.split(',').map(p => p.trim()).filter(p => p);
              
              // PRIORITY 1: Province only (most reliable to avoid wrong location)
              if (parts.length >= 1) {
                const province = parts[parts.length - 1];
                queries.push(`${province}, Vietnam`);
              }
              
              // PRIORITY 2: District + Province
              if (parts.length >= 2) {
                const lastTwo = parts.slice(-2).join(', ') + ', Vietnam';
                if (!queries.includes(lastTwo)) {
                  queries.push(lastTwo);
                }
              }
              
              // PRIORITY 3: Full address (may be too specific and fail)
              const fullQuery = `${cleanText}, Vietnam`;
              if (!queries.includes(fullQuery)) {
                queries.push(fullQuery);
              }
              
              console.log('🔍 Finding reference location for short Plus Code (Province first):', queries);
              
              let refLat = null;
              let refLon = null;
              let foundLocation = null;
              
              // Try each query until one succeeds
              for (const query of queries) {
                try {
                  const refResponse = await fetch(
                    `https://nominatim.openstreetmap.org/search?` +
                    `q=${encodeURIComponent(query)}` +
                    `&format=json` +
                    `&countrycodes=vn` +
                    `&limit=1`,
                    {
                      headers: {
                        'User-Agent': 'FoodOnlineApp/1.0'
                      }
                    }
                  );
                  const refData = await refResponse.json();
                  
                  if (refData && refData.length > 0) {
                    refLat = parseFloat(refData[0].lat);
                    refLon = parseFloat(refData[0].lon);
                    foundLocation = refData[0].display_name;
                    console.log('📍 Reference location found:', { refLat, refLon, name: foundLocation, query });
                    break; // Found it, stop trying
                  }
                } catch (e) {
                  console.warn('Query failed:', query, e);
                }
                
                // Small delay between requests to be nice to Nominatim
                await new Promise(resolve => setTimeout(resolve, 200));
              }
              
              if (refLat && refLon) {
                // Recover full code from short code + reference
                const fullCode = olc.recoverNearest(plusCode, refLat, refLon);
                console.log('🔗 Recovered full Plus Code:', fullCode);
                
                const codeArea = olc.decode(fullCode);
                decodedCoords = {
                  latitude: codeArea.latitudeCenter,
                  longitude: codeArea.longitudeCenter
                };
                console.log('✅ Decoded short Plus Code:', decodedCoords);
              } else {
                console.warn('❌ Could not find any reference location, tried:', queries);
              }
            } else {
              console.warn('❌ Short Plus Code needs more context (city/district name)');
            }
          } else {
            console.warn('❌ Invalid Plus Code format:', plusCode);
          }
          
          if (decodedCoords) {
            setCustomerLocation(decodedCoords);
            toast.success(`🎯 GPS từ Plus Code: ${decodedCoords.latitude.toFixed(6)}, ${decodedCoords.longitude.toFixed(6)}`);
            console.log('✅ Keeping original address:', address);
            setLocationLoading(false);
            return; // Keep original address with Plus Code
          } else {
            toast.info(`💡 Plus Code "${plusCode}" cần thêm thông tin vị trí. Đang tìm từ địa chỉ...`);
          }
        } catch (plusError) {
          console.error('❌ Plus Code decode error:', plusError);
          toast.warning('⚠️ Không decode được Plus Code, đang tìm từ địa chỉ text...');
        }
      }
      
      // Fallback: Geocode using text address (remove Plus Code from search query only)
      let searchQuery = address.replace(plusCodeRegex, '').trim();
      
      // Skip if only Plus Code without text
      if (searchQuery.length < 5) {
        toast.warning('⚠️ Cần thêm địa chỉ text hoặc dùng "📍 Dùng GPS hiện tại"');
        setLocationLoading(false);
        return;
      }
      
      searchQuery = searchQuery.includes('Việt Nam') || searchQuery.includes('Vietnam') 
        ? searchQuery 
        : `${searchQuery}, Vietnam`;
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(searchQuery)}` +
        `&format=json` +
        `&countrycodes=vn` +
        `&limit=1` +
        `&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'FoodOnlineApp/1.0'
          }
        }
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        setCustomerLocation({ 
          latitude: parseFloat(lat), 
          longitude: parseFloat(lon) 
        });
        console.log('Found location:', display_name);
        toast.success(`📍 Tìm thấy: ${display_name}`);
      } else {
        setCustomerLocation(null);
        toast.warning('⚠️ Không tìm thấy địa chỉ chính xác. Vui lòng dùng "📍 Dùng GPS hiện tại" để có tọa độ chính xác nhất');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error('Lỗi khi tìm tọa độ. Vui lòng dùng GPS hiện tại');
    } finally {
      setLocationLoading(false);
    }
  };

  const getCurrentLocation = async (setFieldValue) => {
    setLocationLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCustomerLocation({ latitude, longitude });
          
          // Reverse geocoding: GPS → Address
          try {
            console.log('🔄 Reverse geocoding:', { latitude, longitude });
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?` +
              `lat=${latitude}` +
              `&lon=${longitude}` +
              `&format=json` +
              `&addressdetails=1` +
              `&accept-language=vi`,
              {
                headers: {
                  'User-Agent': 'FoodOnlineApp/1.0'
                }
              }
            );
            const data = await response.json();
            
            if (data && data.display_name) {
              // Build readable address from components
              const addr = data.address || {};
              const addressParts = [];
              
              // House number + road
              if (addr.house_number) addressParts.push(addr.house_number);
              if (addr.road) addressParts.push(addr.road);
              
              // Hamlet/Village/Quarter
              if (addr.hamlet) addressParts.push(addr.hamlet);
              else if (addr.village) addressParts.push(addr.village);
              else if (addr.quarter) addressParts.push(addr.quarter);
              else if (addr.suburb) addressParts.push(addr.suburb);
              
              // District
              if (addr.county) addressParts.push(addr.county);
              else if (addr.town) addressParts.push(addr.town);
              else if (addr.city_district) addressParts.push(addr.city_district);
              
              // Province
              if (addr.state) addressParts.push(addr.state);
              
              // Country
              if (addr.country) addressParts.push(addr.country);
              
              const formattedAddress = addressParts.join(', ') || data.display_name;
              
              console.log('✅ Reverse geocoded address:', formattedAddress);
              
              // Auto-fill address field if setFieldValue provided (from Formik)
              if (setFieldValue) {
                setFieldValue('delivery_address', formattedAddress);
              }
              
              toast.success('📍 Đã lấy vị trí và địa chỉ của bạn');
            } else {
              toast.success('📍 Đã lấy vị trí GPS của bạn');
            }
          } catch (reverseError) {
            console.error('Reverse geocoding error:', reverseError);
            toast.success('📍 Đã lấy vị trí GPS của bạn');
          }
          
          setLocationLoading(false);
        },
        (error) => {
          console.warn('Geolocation error:', error.message);
          setLocationLoading(false);
          toast.warning('Không thể lấy vị trí GPS. Vẫn có thể đặt hàng.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setLocationLoading(false);
      toast.warning('Trình duyệt không hỗ trợ GPS');
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      setError('');

      const orderData = {
        restaurant_id: restaurant.restaurant_id,
        items: cart.map((item) => ({
          menu_item_id: item.item_id,
          quantity: item.quantity,
          special_instructions: '',
        })),
        delivery_address: values.delivery_address,
        customer_phone: values.customer_phone,
        payment_method: values.payment_method,
        notes: values.notes,
        // Include customer GPS coordinates if available
        customer_latitude: customerLocation?.latitude || null,
        customer_longitude: customerLocation?.longitude || null,
      };

      console.log('Order data:', orderData);
      console.log('Cart items:', cart);
      console.log('Restaurant:', restaurant);
      const response = await orderService.create(orderData);
      clearCart();
      toast.success('Đặt hàng thành công!');
      navigate(`/orders/${response.order.id}`);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.errors || 'Failed to place order';
      setError(typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg);
      console.error('Order error:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <h1 className="mb-4">Checkout</h1>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row>
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Delivery Information</h5>
            </Card.Header>
            <Card.Body>
              <Formik
                initialValues={{
                  delivery_address: user?.address || '',
                  customer_phone: user?.phone || '',
                  payment_method: 'CASH',
                  notes: '',
                }}
                validationSchema={checkoutSchema}
                onSubmit={handleSubmit}
              >
                {({ values, errors, touched, handleChange, handleSubmit, setFieldValue }) => (
                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Delivery Address *</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="delivery_address"
                        value={values.delivery_address}
                        onChange={handleChange}
                        onBlur={(e) => geocodeAddress(e.target.value)}
                        isInvalid={touched.delivery_address && errors.delivery_address}
                        placeholder="Nhập địa chỉ hoặc dùng GPS để tự động điền..."
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.delivery_address}
                      </Form.Control.Feedback>
                      <div className="mt-2 d-flex gap-2 align-items-center flex-wrap">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => geocodeAddress(values.delivery_address)}
                          disabled={locationLoading || !values.delivery_address}
                        >
                          {locationLoading ? '🔄 Đang tìm...' : '🗺️ Tìm GPS từ địa chỉ'}
                        </Button>
                        {customerLocation && (
                          <small className="text-success">
                            ✅ GPS: {customerLocation.latitude.toFixed(6)}, {customerLocation.longitude.toFixed(6)}
                          </small>
                        )}
                      </div>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Phone Number *</Form.Label>
                      <Form.Control
                        type="text"
                        name="customer_phone"
                        value={values.customer_phone}
                        onChange={handleChange}
                        isInvalid={touched.customer_phone && errors.customer_phone}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.customer_phone}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Payment Method *</Form.Label>
                      <Form.Select
                        name="payment_method"
                        value={values.payment_method}
                        onChange={handleChange}
                      >
                        <option value="CASH">Cash on Delivery</option>
                        <option value="CREDIT_CARD">Credit Card</option>
                        <option value="DEBIT_CARD">Debit Card</option>
                        <option value="E_WALLET">E-Wallet</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Notes (Optional)</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        name="notes"
                        value={values.notes}
                        onChange={handleChange}
                      />
                    </Form.Group>

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-100"
                      disabled={loading}
                    >
                      {loading ? 'Placing Order...' : 'Place Order'}
                    </Button>
                  </Form>
                )}
              </Formik>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Order Summary</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                {cart.map((item) => (
                  <div key={item.id} className="d-flex justify-content-between mb-2">
                    <span>
                      {item.name} x{item.quantity}
                    </span>
                    <span>
                      {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                ))}
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal:</span>
                <span>{subtotal.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Delivery Fee:</span>
                <span>{deliveryFee.toLocaleString('vi-VN')}đ</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between">
                <strong>Total:</strong>
                <strong className="text-primary">
                  {total.toLocaleString('vi-VN')}đ
                </strong>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Checkout;
