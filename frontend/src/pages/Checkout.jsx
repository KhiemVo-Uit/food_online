import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services';
import { toast } from 'react-toastify';

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
        // Extract Plus Code and try to decode
        const plusCode = plusCodeMatch[0];
        // Plus Codes are best handled by Google Maps API, but we can try OpenStreetMap
        toast.info(`💡 Phát hiện Plus Code: ${plusCode}. Đề xuất dùng "📍 Dùng GPS hiện tại" để chính xác hơn`);
      }
      
      // Remove Plus Code from search query for better results
      let searchQuery = address.replace(plusCodeRegex, '').trim();
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

  const getCurrentLocation = () => {
    setLocationLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCustomerLocation({ latitude, longitude });
          setLocationLoading(false);
          toast.success('📍 Đã lấy vị trí GPS của bạn');
        },
        (error) => {
          console.warn('Geolocation error:', error.message);
          setLocationLoading(false);
          toast.warning('Không thể lấy vị trí GPS. Vẫn có thể đặt hàng.');
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
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
                {({ values, errors, touched, handleChange, handleSubmit }) => (
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
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.delivery_address}
                      </Form.Control.Feedback>
                      <div className="mt-2 d-flex gap-2 align-items-center flex-wrap">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => geocodeAddress(values.delivery_address)}
                          disabled={locationLoading || !values.delivery_address}
                        >
                          {locationLoading ? '🔄 Đang tìm...' : '🗺️ Tìm GPS từ địa chỉ'}
                        </Button>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={getCurrentLocation}
                          disabled={locationLoading}
                        >
                          📍 Dùng GPS hiện tại
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
