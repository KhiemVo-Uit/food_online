<?php

namespace App\Services;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class WebSocketService
{
    protected $client;
    protected $baseUrl;

    public function __construct()
    {
        $this->client = new Client([
            'timeout' => 2.0,
            'http_errors' => false,
        ]);
        $this->baseUrl = env('WEBSOCKET_SERVER_URL', 'http://localhost:8080');
    }

    /**
     * Send notification to specific user via WebSocket
     */
    public function sendNotificationToUser($userId, $notification)
    {
        try {
            $response = $this->client->post("{$this->baseUrl}/api/notify", [
                'json' => [
                    'user_id' => $userId,
                    'notification' => [
                        'id' => $notification->id,
                        'type' => $notification->type,
                        'title' => $notification->title,
                        'message' => $notification->message,
                        'data' => $notification->data,
                        'created_at' => $notification->created_at->toISOString(),
                        'read_at' => $notification->read_at,
                    ]
                ]
            ]);

            $responseBody = json_decode($response->getBody(), true);
            
            if ($response->getStatusCode() === 200 && isset($responseBody['delivered']) && $responseBody['delivered']) {
                Log::info('🔔 WebSocket notification delivered to user ' . $userId, [
                    'notification_type' => $notification->type,
                    'socket_id' => $responseBody['socketId'] ?? null
                ]);
            } else {
                Log::warning('⚠️ User not connected - notification saved to DB only', [
                    'user_id' => $userId,
                    'notification_type' => $notification->type,
                    'response' => $responseBody
                ]);
            }
        } catch (\Exception $e) {
            Log::warning('❌ WebSocket connection failed: ' . $e->getMessage(), [
                'user_id' => $userId,
                'notification_type' => $notification->type ?? 'unknown'
            ]);
            // Don't throw exception - notifications will still work via polling
        }
    }

    /**
     * Broadcast order status update to all watchers
     */
    public function broadcastOrderStatusUpdate($orderId, $status, $message)
    {
        try {
            $this->client->post("{$this->baseUrl}/api/order-status", [
                'json' => [
                    'order_id' => $orderId,
                    'status' => $status,
                    'message' => $message,
                ]
            ]);
        } catch (\Exception $e) {
            Log::warning('WebSocket order status broadcast failed: ' . $e->getMessage());
        }
    }

    /**
     * Broadcast location update
     */
    public function broadcastLocationUpdate($orderId, $latitude, $longitude, $status)
    {
        try {
            $this->client->post("{$this->baseUrl}/api/location", [
                'json' => [
                    'order_id' => $orderId,
                    'latitude' => $latitude,
                    'longitude' => $longitude,
                    'status' => $status,
                ]
            ]);
        } catch (\Exception $e) {
            Log::warning('WebSocket location broadcast failed: ' . $e->getMessage());
        }
    }

    /**
     * Broadcast customer location update (so shipper can see)
     */
    public function broadcastCustomerLocation($orderId, $latitude, $longitude)
    {
        try {
            $this->client->post("{$this->baseUrl}/api/customer-location", [
                'json' => [
                    'order_id' => $orderId,
                    'latitude' => $latitude,
                    'longitude' => $longitude,
                ]
            ]);
        } catch (\Exception $e) {
            Log::warning('WebSocket customer location broadcast failed: ' . $e->getMessage());
        }
    }
}
