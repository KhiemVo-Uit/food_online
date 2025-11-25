import { useState, useEffect } from 'react';
import { Container, ListGroup, Badge, Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../services';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getAll();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id);
    }
    
    if (notification.data?.order_id) {
      navigate(`/orders/${notification.data.order_id}`);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'NEW_ORDER':
        return '📦';
      case 'ORDER_CONFIRMED':
        return '✅';
      case 'ORDER_CANCELLED':
        return '❌';
      case 'ORDER_DELIVERED':
        return '🎉';
      default:
        return '📬';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>
          Thông báo
          {unreadCount > 0 && (
            <Badge bg="danger" className="ms-2">
              {unreadCount} chưa đọc
            </Badge>
          )}
        </h1>
        {unreadCount > 0 && (
          <Button variant="outline-primary" size="sm" onClick={handleMarkAllAsRead}>
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-bell" style={{ fontSize: '3rem' }}></i>
          <p className="mt-3">Chưa có thông báo nào</p>
        </div>
      ) : (
        <ListGroup>
          {notifications.map((notification) => (
            <ListGroup.Item
              key={notification.id}
              action
              onClick={() => handleNotificationClick(notification)}
              className={`${!notification.is_read ? 'border-start border-primary border-4' : ''}`}
              style={{ cursor: 'pointer' }}
            >
              <div className="d-flex align-items-start">
                <div className="me-3" style={{ fontSize: '2rem' }}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <h6 className="mb-1">
                      {notification.title}
                      {!notification.is_read && (
                        <Badge bg="primary" className="ms-2">
                          Mới
                        </Badge>
                      )}
                    </h6>
                    <small className="text-muted">
                      {formatTime(notification.created_at)}
                    </small>
                  </div>
                  <p className="mb-0 text-muted">{notification.message}</p>
                </div>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </Container>
  );
}

export default Notifications;
