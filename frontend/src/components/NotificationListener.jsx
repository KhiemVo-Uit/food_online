import { useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

function NotificationListener() {
  const { isConnected, onNotification, off } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isConnected) return;

    const handleNotification = (notification) => {
      console.log('Real-time notification received:', notification);

      // Show toast notification
      const message = `${notification.title}: ${notification.message}`;
      
      toast.info(message, {
        position: 'top-right',
        autoClose: 5000,
        onClick: () => {
          // Navigate to order detail when clicked
          if (notification.data?.order_id) {
            const currentPath = window.location.pathname;
            const targetPath = `/orders/${notification.data.order_id}`;
            
            // If already on the order page, force refresh
            if (currentPath === targetPath) {
              window.location.reload();
            } else {
              navigate(targetPath);
            }
          }
        },
        style: {
          cursor: 'pointer'
        }
      });

      // Play notification sound (optional)
      try {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(err => console.log('Audio play failed:', err));
      } catch (err) {
        console.log('Audio not available');
      }

      // Trigger browser notification (optional)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/logo.png',
          badge: '/logo.png',
          tag: `order-${notification.data?.order_id}`,
          requireInteraction: true
        });
      }

      // Dispatch custom event for other components to update
      window.dispatchEvent(new CustomEvent('notification:received', {
        detail: notification
      }));
    };

    onNotification(handleNotification);

    return () => {
      off('notification:new', handleNotification);
    };
  }, [isConnected, navigate]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return null; // This is a headless component
}

export default NotificationListener;
