import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { restaurantService, menuService } from '../services';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';

function RestaurantDetail() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addToCart } = useCart();

  useEffect(() => {
    fetchRestaurantData();
  }, [id]);

  const fetchRestaurantData = async () => {
    try {
      setLoading(true);
      const [restaurantRes, menuRes] = await Promise.all([
        restaurantService.getById(id),
        menuService.getByRestaurant(id),
      ]);
      setRestaurant(restaurantRes);
      setMenuItems(menuRes);
    } catch (err) {
      setError('Failed to load restaurant data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (item) => {
    const cartItem = {
      item_id: item.id,
      name: item.name,
      price: parseFloat(item.price),
      quantity: 1,
      image_url: item.image_url,
    };

    const restaurantInfo = {
      restaurant_id: restaurant.id,
      restaurant_name: restaurant.name,
    };

    await addToCart(cartItem, restaurantInfo);
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (error || !restaurant) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error || 'Restaurant not found'}</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Card className="mb-4">
        {restaurant.image_url && (
          <Card.Img
            variant="top"
            src={restaurant.image_url}
            style={{ height: '300px', objectFit: 'cover' }}
          />
        )}
        <Card.Body>
          <Card.Title as="h1">{restaurant.name}</Card.Title>
          <Card.Text>{restaurant.description}</Card.Text>
          <div className="d-flex gap-3">
            <span>⭐ {restaurant.rating ? parseFloat(restaurant.rating).toFixed(1) : 'New'}</span>
            <span>📍 {restaurant.address}</span>
            <span>📞 {restaurant.phone}</span>
            <span>
              🕐 {restaurant.opening_time} - {restaurant.closing_time}
            </span>
          </div>
        </Card.Body>
      </Card>

      <h2 className="mb-4">Menu</h2>
      <Row>
        {menuItems.map((item) => (
          <Col key={item.id} md={6} lg={4} className="mb-4">
            <Card className="h-100">
              {item.image_url && (
                <Card.Img
                  variant="top"
                  src={item.image_url}
                  style={{ height: '150px', objectFit: 'cover' }}
                />
              )}
              <Card.Body className="d-flex flex-column">
                <Card.Title>{item.name}</Card.Title>
                <Card.Text className="flex-grow-1">{item.description}</Card.Text>
                <div className="d-flex justify-content-between align-items-center">
                  <strong className="text-primary">
                    {item.price.toLocaleString('vi-VN')}đ
                  </strong>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleAddToCart(item)}
                    disabled={!item.is_available}
                  >
                    {item.is_available ? 'Add to Cart' : 'Unavailable'}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {menuItems.length === 0 && (
        <Alert variant="info">No menu items available</Alert>
      )}
    </Container>
  );
}

export default RestaurantDetail;
