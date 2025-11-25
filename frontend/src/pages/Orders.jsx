import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Table, Badge, Spinner, Alert } from 'react-bootstrap';
import { orderService } from '../services';

const statusColors = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  COOKING: 'primary',
  PICKING_UP: 'secondary',
  DELIVERING: 'info',
  DELIVERED: 'success',
  CANCELLED: 'danger',
};

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getAll();
      // Response is paginated: response contains data array
      console.log('Orders response:', response);
      setOrders(response.data || []);
    } catch (err) {
      setError('Failed to load orders');
      console.error('Orders error:', err);
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
      <h1 className="mb-4">My Orders</h1>

      {error && <Alert variant="danger">{error}</Alert>}

      {orders.length === 0 ? (
        <Alert variant="info">
          No orders yet. <Alert.Link href="/restaurants">Start ordering!</Alert.Link>
        </Alert>
      ) : (
        <Table responsive hover>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Restaurant</th>
              <th>Date</th>
              <th>Total</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>{order.restaurant?.name}</td>
                <td>{new Date(order.created_at).toLocaleDateString('vi-VN')}</td>
                <td>{order.total.toLocaleString('vi-VN')}đ</td>
                <td>
                  <Badge bg={statusColors[order.status]}>{order.status}</Badge>
                </td>
                <td>
                  <Link to={`/orders/${order.id}`} className="btn btn-sm btn-primary">
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
}

export default Orders;
