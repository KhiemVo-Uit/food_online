import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Row, Col, Badge, Button, Spinner, Alert, ListGroup } from 'react-bootstrap';
import { orderService } from '../services';
import { toast } from 'react-toastify';
import ShipperLocationTracker from '../components/ShipperLocationTracker';

const statusColors = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  COOKING: 'primary',
  PICKING_UP: 'secondary',
  DELIVERING: 'info',
  DELIVERED: 'success',
  CANCELLED: 'danger',
};

function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrder();
    fetchUser();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await orderService.getById(id);
      setOrder(response);
    } catch (err) {
      setError('Failed to load order details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async () => {
    try {
      const { authService } = await import('../services');
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (err) {
      console.error('Failed to fetch user:', err);
    }
  };

  const handleConfirmOrder = async () => {
    if (!window.confirm('Confirm this order? This will notify the shipper to pick up the order.')) {
      return;
    }

    try {
      setUpdating(true);
      await orderService.updateStatus(id, 'CONFIRMED');
      toast.success('Order confirmed successfully');
      fetchOrder();
    } catch (err) {
      toast.error('Failed to confirm order');
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      setUpdating(true);
      await orderService.updateStatus(id, 'CANCELLED');
      toast.success('Order cancelled successfully');
      fetchOrder();
    } catch (err) {
      toast.error('Failed to cancel order');
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handlePickUp = async () => {
    if (!window.confirm('Confirm that you are picking up this order?')) {
      return;
    }

    try {
      setUpdating(true);
      await orderService.updateStatus(id, 'PICKING_UP');
      toast.success('Status updated to Picking Up');
      fetchOrder();
    } catch (err) {
      toast.error('Failed to update status');
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleStartDelivery = async () => {
    if (!window.confirm('Confirm that you are delivering this order?')) {
      return;
    }

    try {
      setUpdating(true);
      await orderService.updateStatus(id, 'DELIVERING');
      toast.success('Status updated to Delivering');
      fetchOrder();
    } catch (err) {
      toast.error('Failed to update status');
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleCompleteDelivery = async () => {
    if (!window.confirm('Confirm that this order has been delivered?')) {
      return;
    }

    try {
      setUpdating(true);
      await orderService.updateStatus(id, 'DELIVERED');
      toast.success('Order delivered successfully!');
      fetchOrder();
    } catch (err) {
      toast.error('Failed to update status');
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleShipperAccept = async () => {
    if (!window.confirm('Accept this order? You will be responsible for delivering it.')) {
      return;
    }

    try {
      setUpdating(true);
      await orderService.updateStatus(id, 'CONFIRMED');
      toast.success('Order accepted! Waiting for restaurant to prepare.');
      fetchOrder();
    } catch (err) {
      toast.error('Failed to accept order');
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleShipperReject = async () => {
    if (!window.confirm('Are you sure you want to reject this order? It will be cancelled.')) {
      return;
    }

    try {
      setUpdating(true);
      await orderService.updateStatus(id, 'CANCELLED');
      toast.success('Order rejected');
      fetchOrder();
    } catch (err) {
      toast.error('Failed to reject order');
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (error || !order) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error || 'Order not found'}</Alert>
        <Button onClick={() => navigate('/orders')}>Back to Orders</Button>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Order #{order.id}</h1>
        <Badge bg={statusColors[order.status]} className="fs-6">
          {order.status}
        </Badge>
      </div>

      <Row>
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Order Items</h5>
            </Card.Header>
            <ListGroup variant="flush">
              {order.order_items?.map((item) => (
                <ListGroup.Item key={item.id}>
                  <div className="d-flex justify-content-between">
                    <div>
                      <h6>{item.menu_item?.name}</h6>
                      <p className="text-muted mb-0">
                        {item.price.toLocaleString('vi-VN')}đ x {item.quantity}
                      </p>
                    </div>
                    <strong>
                      {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                    </strong>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>

          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Delivery Information</h5>
            </Card.Header>
            <Card.Body>
              <p>
                <strong>Address:</strong> {order.delivery_address}
              </p>
              <p>
                <strong>Phone:</strong> {order.customer_phone}
              </p>
              {order.notes && (
                <p>
                  <strong>Notes:</strong> {order.notes}
                </p>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Restaurant</h5>
            </Card.Header>
            <Card.Body>
              <h6>{order.restaurant?.name}</h6>
              <p className="text-muted mb-0">{order.restaurant?.address}</p>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Payment</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal:</span>
                <span>{order.subtotal.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Delivery Fee:</span>
                <span>{order.delivery_fee.toLocaleString('vi-VN')}đ</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-2">
                <strong>Total:</strong>
                <strong className="text-primary">
                  {order.total.toLocaleString('vi-VN')}đ
                </strong>
              </div>
              <div className="mt-3">
                <p className="mb-0">
                  <strong>Payment Method:</strong> {order.payment?.payment_method}
                </p>
                <p className="mb-0">
                  <strong>Payment Status:</strong>{' '}
                  <Badge bg={order.payment?.status === 'COMPLETED' ? 'success' : 'warning'}>
                    {order.payment?.status}
                  </Badge>
                </p>
              </div>
            </Card.Body>
          </Card>

          {user && (
            <>
              {/* Customer Track Order Button */}
              {user.role === 'CUSTOMER' && order.customer_id === user.id && ['PICKING_UP', 'DELIVERING'].includes(order.status) && (
                <Button 
                  variant="primary" 
                  className="w-100 mb-3" 
                  onClick={() => navigate(`/orders/${order.id}/tracking`)}
                >
                  📍 Track Order in Real-time
                </Button>
              )}

              {/* Restaurant Owner Actions */}
              {user.role === 'RESTAURANT_OWNER' && order.restaurant?.owner_id === user.id && order.status === 'PENDING' && (
                <Button 
                  variant="success" 
                  className="w-100 mb-2" 
                  onClick={handleConfirmOrder}
                  disabled={updating}
                >
                  {updating ? 'Confirming...' : 'Confirm Order'}
                </Button>
              )}

              {/* Shipper GPS Tracking */}
              {user.role === 'SHIPPER' && order.shipper_id && (
                <ShipperLocationTracker order={order} />
              )}

              {/* Shipper Actions */}
              {user.role === 'SHIPPER' && order.shipper_id && (
                <>
                  {/* Accept/Reject for new assigned orders */}
                  {order.status === 'PENDING' && (
                    <div className="d-grid gap-2">
                      <Button 
                        variant="success" 
                        onClick={handleShipperAccept}
                        disabled={updating}
                      >
                        {updating ? 'Accepting...' : '✅ Accept Order'}
                      </Button>
                      <Button 
                        variant="danger" 
                        onClick={handleShipperReject}
                        disabled={updating}
                      >
                        {updating ? 'Rejecting...' : '❌ Reject Order'}
                      </Button>
                    </div>
                  )}

                  {/* Pick up action after restaurant confirms */}
                  {order.status === 'CONFIRMED' && (
                    <div className="d-grid gap-2">
                      <Button 
                        variant="primary" 
                        onClick={handlePickUp}
                        disabled={updating}
                      >
                        {updating ? 'Updating...' : '📦 Pick Up Order'}
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        onClick={handleShipperReject}
                        disabled={updating}
                      >
                        {updating ? 'Rejecting...' : '❌ Reject Order'}
                      </Button>
                    </div>
                  )}

                  {/* Active delivery actions */}
                  {order.status === 'PICKING_UP' && (
                    <>
                      <Button 
                        variant="info" 
                        className="w-100 mb-2" 
                        onClick={handleStartDelivery}
                        disabled={updating}
                      >
                        {updating ? 'Updating...' : '🚚 Start Delivery'}
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        className="w-100" 
                        onClick={handleShipperReject}
                        disabled={updating}
                      >
                        {updating ? 'Cancelling...' : 'Cancel Delivery'}
                      </Button>
                    </>
                  )}

                  {order.status === 'DELIVERING' && (
                    <>
                      <Button 
                        variant="success" 
                        className="w-100 mb-2" 
                        onClick={handleCompleteDelivery}
                        disabled={updating}
                      >
                        {updating ? 'Updating...' : '✅ Complete Delivery'}
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        className="w-100" 
                        onClick={handleShipperReject}
                        disabled={updating}
                      >
                        {updating ? 'Cancelling...' : 'Cancel Delivery'}
                      </Button>
                    </>
                  )}
                </>
              )}

              {/* Cancel Button */}
              {order.status === 'PENDING' && (user.role === 'CUSTOMER' || user.role === 'RESTAURANT_OWNER') && (
                <Button 
                  variant="danger" 
                  className="w-100" 
                  onClick={handleCancelOrder}
                  disabled={updating}
                >
                  {updating ? 'Cancelling...' : 'Cancel Order'}
                </Button>
              )}
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default OrderDetail;
