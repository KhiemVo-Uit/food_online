import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, ListGroup, Alert } from 'react-bootstrap';
import { useCart } from '../context/CartContext';

function Cart() {
  const navigate = useNavigate();
  const { cart, restaurant, removeFromCart, updateQuantity, clearCart, getCartTotal } = useCart();

  if (cart.length === 0) {
    return (
      <Container className="py-5">
        <Alert variant="info">
          Your cart is empty. <Alert.Link href="/restaurants">Browse restaurants</Alert.Link>
        </Alert>
      </Container>
    );
  }

  const deliveryFee = 20000;
  const subtotal = getCartTotal();
  const total = subtotal + deliveryFee;

  return (
    <Container className="py-5">
      <h1 className="mb-4">Shopping Cart</h1>

      <Row>
        <Col lg={8}>
          <Card className="mb-3">
            <Card.Header>
              <h5 className="mb-0">
                {restaurant?.restaurant_name || 'Restaurant'}
              </h5>
            </Card.Header>
            <ListGroup variant="flush">
              {cart.map((item) => (
                <ListGroup.Item key={item.item_id}>
                  <Row className="align-items-center">
                    <Col md={6}>
                      <h6>{item.name}</h6>
                      <p className="text-muted mb-0">
                        {item.price.toLocaleString('vi-VN')}đ
                      </p>
                    </Col>
                    <Col md={3}>
                      <div className="d-flex align-items-center gap-2">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => updateQuantity(item.item_id, item.quantity - 1)}
                        >
                          -
                        </Button>
                        <span>{item.quantity}</span>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => updateQuantity(item.item_id, item.quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </Col>
                    <Col md={2} className="text-end">
                      <strong>
                        {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                      </strong>
                    </Col>
                    <Col md={1} className="text-end">
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => removeFromCart(item.item_id)}
                      >
                        ×
                      </Button>
                    </Col>
                  </Row>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>

          <Button variant="outline-danger" onClick={clearCart}>
            Clear Cart
          </Button>
        </Col>

        <Col lg={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Order Summary</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal:</span>
                <span>{subtotal.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Delivery Fee:</span>
                <span>{deliveryFee.toLocaleString('vi-VN')}đ</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-3">
                <strong>Total:</strong>
                <strong className="text-primary">
                  {total.toLocaleString('vi-VN')}đ
                </strong>
              </div>
              <Button
                variant="primary"
                className="w-100"
                onClick={() => navigate('/checkout')}
              >
                Proceed to Checkout
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Cart;
