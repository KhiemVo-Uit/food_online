import { useState, useEffect } from 'react';
import { Dropdown, Badge } from 'react-bootstrap';
import { notificationService } from '../services';
import { useNavigate } from 'react-router-dom';
import './NotificationBell.css';

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getUnread();
      setNotifications(data.notifications || []);
      setUnreadCount(data.count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
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

  const handleNotificationClick = async (notification) => {
    await handleMarkAsRead(notification.id);
    
    // Navigate based on notification type
    if (notification.data?.order_id) {
      navigate(`/orders/${notification.data.order_id}`);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds

    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <Dropdown align="end">
      <Dropdown.Toggle variant="link" id="notification-dropdown" className="notification-bell">
        <i className="bi bi-bell-fill"></i>
        {unreadCount > 0 && (
          <Badge bg="danger" className="notification-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu className="notification-menu">
        <div className="notification-header">
          <h6 className="mb-0">Thông báo</h6>
          {unreadCount > 0 && (
            <small className="text-muted">{unreadCount} chưa đọc</small>
          )}
        </div>
        
        <div className="notification-list">
          {notifications.length === 0 ? (
            <div className="text-center py-3 text-muted">
              Không có thông báo mới
            </div>
          ) : (
            notifications.map((notification) => (
              <Dropdown.Item
                key={notification.id}
                className="notification-item"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="d-flex">
                  <div className="notification-icon">
                    {notification.type === 'NEW_ORDER' && '📦'}
                    {notification.type === 'ORDER_CONFIRMED' && '✅'}
                    {notification.type === 'ORDER_CANCELLED' && '❌'}
                    {notification.type === 'ORDER_DELIVERED' && '🎉'}
                  </div>
                  <div className="flex-grow-1">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <small className="notification-time text-muted">
                      {formatTime(notification.created_at)}
                    </small>
                  </div>
                  {!notification.is_read && (
                    <div className="notification-unread-dot"></div>
                  )}
                </div>
              </Dropdown.Item>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div className="notification-footer">
            <Dropdown.Item
              className="text-center text-primary"
              onClick={() => navigate('/notifications')}
            >
              Xem tất cả
            </Dropdown.Item>
          </div>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
}

export default NotificationBell;
