<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;

class NotificationService
{
    protected $webSocketService;

    public function __construct(WebSocketService $webSocketService)
    {
        $this->webSocketService = $webSocketService;
    }

    /**
     * Send notification to user
     */
    public function sendToUser($userId, $type, $title, $message, $data = [])
    {
        $notification = Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
        ]);

        // Send real-time notification via WebSocket
        $this->webSocketService->sendNotificationToUser($userId, $notification);

        return $notification;
    }

    /**
     * Notify shipper about new order assignment
     */
    public function notifyShipperNewOrder($shipper, $order)
    {
        return $this->sendToUser(
            $shipper->user_id,
            'NEW_ORDER',
            'Đơn hàng mới!',
            sprintf(
                'Bạn có đơn hàng mới #%s từ %s. Giá trị: %s đ',
                $order->id,
                $order->restaurant->name,
                number_format($order->total, 0, ',', '.')
            ),
            [
                'order_id' => $order->id,
                'restaurant_id' => $order->restaurant_id,
                'restaurant_name' => $order->restaurant->name,
                'delivery_address' => $order->delivery_address,
                'customer_phone' => $order->customer_phone,
                'total' => $order->total,
            ]
        );
    }

    /**
     * Notify restaurant owner about new order
     */
    public function notifyRestaurantNewOrder($restaurantOwnerId, $order)
    {
        return $this->sendToUser(
            $restaurantOwnerId,
            'NEW_ORDER',
            'Đơn hàng mới!',
            sprintf(
                'Bạn có đơn hàng mới #%s. Giá trị: %s đ. Vui lòng xác nhận đơn hàng.',
                $order->id,
                number_format($order->total, 0, ',', '.')
            ),
            [
                'order_id' => $order->id,
                'customer_name' => $order->customer->name ?? 'Khách hàng',
                'customer_phone' => $order->customer_phone,
                'delivery_address' => $order->delivery_address,
                'total' => $order->total,
                'items_count' => $order->orderItems->count(),
            ]
        );
    }

    /**
     * Notify shipper about order status change
     */
    public function notifyShipperOrderStatus($shipper, $order, $status)
    {
        $messages = [
            'CONFIRMED' => 'Đơn hàng #' . $order->id . ' đã được xác nhận, sẵn sàng lấy hàng',
            'CANCELLED' => 'Đơn hàng #' . $order->id . ' đã bị hủy',
        ];

        if (!isset($messages[$status])) {
            return null;
        }

        return $this->sendToUser(
            $shipper->user_id,
            'ORDER_' . $status,
            'Cập nhật đơn hàng #' . $order->id,
            $messages[$status],
            [
                'order_id' => $order->id,
                'status' => $status,
                'restaurant_name' => $order->restaurant->name ?? '',
            ]
        );
    }

    /**
     * Notify customer about order status change
     */
    public function notifyCustomerOrderStatus($order, $status)
    {
        $messages = [
            'CONFIRMED' => 'Đơn hàng đã được xác nhận',
            'COOKING' => 'Nhà hàng đang chuẩn bị món ăn',
            'PICKING_UP' => 'Shipper đang đến lấy hàng',
            'DELIVERING' => 'Shipper đang giao hàng đến bạn',
            'DELIVERED' => 'Đơn hàng đã được giao thành công',
            'CANCELLED' => 'Đơn hàng đã bị hủy',
        ];

        return $this->sendToUser(
            $order->customer_id,
            'ORDER_' . $status,
            'Cập nhật đơn hàng #' . $order->id,
            $messages[$status] ?? 'Đơn hàng đã được cập nhật',
            [
                'order_id' => $order->id,
                'status' => $status,
            ]
        );
    }

    /**
     * Get unread notifications for user
     */
    public function getUnreadForUser($userId)
    {
        return Notification::where('user_id', $userId)
            ->where('is_read', false)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get all notifications for user
     */
    public function getAllForUser($userId, $limit = 50)
    {
        return Notification::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Mark notification as read
     */
    public function markAsRead($notificationId, $userId)
    {
        return Notification::where('id', $notificationId)
            ->where('user_id', $userId)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
    }

    /**
     * Mark all notifications as read for user
     */
    public function markAllAsRead($userId)
    {
        return Notification::where('user_id', $userId)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
    }
}
