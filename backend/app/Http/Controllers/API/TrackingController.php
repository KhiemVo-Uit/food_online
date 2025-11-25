<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Shipper;
use App\Events\OrderLocationUpdated;
use Illuminate\Http\Request;

class TrackingController extends Controller
{
    /**
     * Update shipper location and broadcast to customer
     */
    public function updateLocation(Request $request, Order $order)
    {
        $user = $request->user();
        
        // Only shipper assigned to this order can update location
        if ($user->role !== 'SHIPPER') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $shipper = Shipper::where('user_id', $user->id)->first();
        if (!$shipper || $order->shipper_id !== $shipper->id) {
            return response()->json(['message' => 'Not assigned to this order'], 403);
        }

        $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        // Update shipper location
        $shipper->update([
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
        ]);

        // Broadcast location update via WebSocket
        try {
            $webSocketService = new \App\Services\WebSocketService();
            $webSocketService->broadcastLocationUpdate(
                $order->id,
                $request->latitude,
                $request->longitude,
                $order->status
            );
        } catch (\Exception $e) {
            \Log::warning('WebSocket location broadcast failed: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Location updated successfully',
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
        ]);
    }

    /**
     * Get current shipper location for an order
     */
    public function getLocation(Request $request, Order $order)
    {
        $user = $request->user();
        
        // Only customer of this order can track
        if ($user->role === 'CUSTOMER' && $order->customer_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (!$order->shipper) {
            return response()->json([
                'message' => 'No shipper assigned yet',
                'shipper_location' => null,
            ]);
        }

        return response()->json([
            'order_id' => $order->id,
            'status' => $order->status,
            'shipper_location' => [
                'latitude' => $order->shipper->latitude,
                'longitude' => $order->shipper->longitude,
                'updated_at' => $order->shipper->updated_at,
            ],
            'restaurant_location' => [
                'latitude' => $order->restaurant->latitude,
                'longitude' => $order->restaurant->longitude,
            ],
            'customer_location' => [
                'latitude' => $order->customer_latitude,
                'longitude' => $order->customer_longitude,
            ],
            'delivery_address' => $order->delivery_address,
        ]);
    }

    /**
     * Update customer location (called when customer shares GPS)
     */
    public function updateCustomerLocation(Request $request, Order $order)
    {
        $user = $request->user();
        
        // Only customer of this order can update their location
        if ($user->role !== 'CUSTOMER' || $order->customer_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        // Update customer location in order
        $order->update([
            'customer_latitude' => $request->latitude,
            'customer_longitude' => $request->longitude,
        ]);

        // Broadcast to shipper via WebSocket (optional)
        try {
            $webSocketService = new \App\Services\WebSocketService();
            $webSocketService->broadcastCustomerLocation(
                $order->id,
                $request->latitude,
                $request->longitude
            );
        } catch (\Exception $e) {
            \Log::warning('WebSocket customer location broadcast failed: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Customer location updated successfully',
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
        ]);
    }
}
