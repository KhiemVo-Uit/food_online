import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Spinner, Alert } from 'react-bootstrap';
import { restaurantService } from '../services';

function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchRestaurants();
  }, [search]);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const params = search ? { search } : {};
      const response = await restaurantService.getAll(params);
      setRestaurants(response.data);
    } catch (err) {
      setError('Failed to load restaurants');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h1 className="mb-4">Restaurants</h1>

      <Form.Group className="mb-4">
        <Form.Control
          type="text"
          placeholder="Search restaurants..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Form.Group>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row>
        {restaurants.map((restaurant) => (
          <Col key={restaurant.id} md={4} className="mb-4">
            <Card>
              {restaurant.image_url && (
                <Card.Img
                  variant="top"
                  src={restaurant.image_url}
                  style={{ height: '200px', objectFit: 'cover' }}
                />
              )}
              <Card.Body>
                <Card.Title>{restaurant.name}</Card.Title>
                <Card.Text>{restaurant.description}</Card.Text>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-warning">
                    ⭐ {restaurant.rating ? parseFloat(restaurant.rating).toFixed(1) : 'New'}
                  </span>
                  <Link
                    to={`/restaurants/${restaurant.id}`}
                    className="btn btn-primary btn-sm"
                  >
                    View Menu
                  </Link>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {restaurants.length === 0 && !loading && (
        <Alert variant="info">No restaurants found</Alert>
      )}
    </Container>
  );
}

export default Restaurants;
