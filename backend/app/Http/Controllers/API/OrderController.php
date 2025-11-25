<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Restaurant;
use App\Models\Shipper;
use App\Services\ShipperMatchingService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $query = Order::with(['restaurant', 'orderItems.menuItem', 'payment']);

        if ($request->user()->role === 'CUSTOMER') {
            $query->where('customer_id', $request->user()->id);
        } elseif ($request->user()->role === 'RESTAURANT_OWNER') {
            $restaurantIds = $request->user()->restaurants->pluck('id');
            $query->whereIn('restaurant_id', $restaurantIds);
        } elseif ($request->user()->role === 'SHIPPER') {
            $query->where('shipper_id', $request->user()->id);
        }

        $orders = $query->orderBy('created_at', 'desc')->paginate(10);

        return response()->json($orders);
    }

    public function store(StoreOrderRequest $request)
    {
        try {
            DB::beginTransaction();

            $subtotal = 0;
            $items = [];

            foreach ($request->items as $item) {
                $menuItem = MenuItem::findOrFail($item['menu_item_id']);
                $price = $menuItem->price;
                $subtotal += $price * $item['quantity'];

                $items[] = [
                    'menu_item_id' => $item['menu_item_id'],
                    'quantity' => $item['quantity'],
                    'price' => $price,
                    'special_instructions' => $item['special_instructions'] ?? null,
                ];
            }

            $deliveryFee = 20000; // Fixed delivery fee
            $total = $subtotal + $deliveryFee;

            $order = Order::create([
                'customer_id' => $request->user()->id,
                'restaurant_id' => $request->restaurant_id,
                'status' => 'PENDING',
                'subtotal' => $subtotal,
                'delivery_fee' => $deliveryFee,
                'total' => $total,
                'delivery_address' => $request->delivery_address,
                'customer_latitude' => $request->customer_latitude,
                'customer_longitude' => $request->customer_longitude,
                'customer_phone' => $request->customer_phone,
                'notes' => $request->notes,
            ]);

            foreach ($items as $item) {
                $order->orderItems()->create($item);
            }

            Payment::create([
                'order_id' => $order->id,
                'payment_method' => $request->payment_method,
                'amount' => $total,
                'status' => 'PENDING',
            ]);

            // Auto-assign nearest available shipper
            $restaurant = Restaurant::find($request->restaurant_id);
            $shipperService = new ShipperMatchingService();
            
            $assignmentResult = $shipperService->assignShipperToOrder(
                $order,
                $restaurant->latitude ?? 10.7626,  // Default to HCM coordinates if not set
                $restaurant->longitude ?? 106.6602
            );

            // Send notifications
            $webSocketService = new \App\Services\WebSocketService();
            $notificationService = new NotificationService($webSocketService);
            
            // Notify shipper if assigned
            if ($assignmentResult['success'] && $assignmentResult['shipper']) {
                $order->load('restaurant');
                $notificationService->notifyShipperNewOrder(
                    $assignmentResult['shipper'],
                    $order
                );
            }

            // Notify restaurant owner about new order
            $order->load(['customer', 'orderItems']);
            $notificationService->notifyRestaurantNewOrder(
                $restaurant->owner_id,
                $order
            );

            DB::commit();

            $order->load(['restaurant', 'orderItems.menuItem', 'payment', 'shipper.user']);

            return response()->json([
                'message' => 'Order created successfully',
                'order' => $order,
                'shipper_assignment' => $assignmentResult,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Order $order)
    {
        $user = auth()->user();

        if ($user->role === 'CUSTOMER' && $order->customer_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($user->role === 'RESTAURANT_OWNER' && !$user->restaurants->contains($order->restaurant_id)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $order->load(['customer', 'restaurant', 'shipper', 'orderItems.menuItem', 'payment']);

        return response()->json($order);
    }

    public function updateStatus(UpdateOrderStatusRequest $request, Order $order)
    {
        $user = $request->user();
        $newStatus = $request->status;

        // Authorization checks
        if ($user->role === 'RESTAURANT_OWNER') {
            if (!$user->restaurants->contains($order->restaurant_id)) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            if (!in_array($newStatus, ['CONFIRMED', 'COOKING', 'CANCELLED'])) {
                return response()->json(['message' => 'Invalid status for restaurant owner'], 400);
            }
        } elseif ($user->role === 'SHIPPER') {
            // Check if shipper is assigned to this order
            $shipper = Shipper::where('user_id', $user->id)->first();
            if (!$shipper) {
                return response()->json(['message' => 'Shipper profile not found'], 404);
            }
            if ($order->shipper_id !== $shipper->id) {
                return response()->json(['message' => 'Unauthorized - Not assigned to this order'], 403);
            }
            // Shipper can accept (CONFIRMED), pick up, deliver, or cancel orders
            if (!in_array($newStatus, ['CONFIRMED', 'PICKING_UP', 'DELIVERING', 'DELIVERED', 'CANCELLED'])) {
                return response()->json(['message' => 'Invalid status for shipper'], 400);
            }
            // Shipper can only set CONFIRMED when order is PENDING (accepting the order)
            if ($newStatus === 'CONFIRMED' && $order->status !== 'PENDING') {
                return response()->json(['message' => 'Can only confirm pending orders'], 400);
            }
        } elseif ($user->role === 'CUSTOMER') {
            if ($newStatus !== 'CANCELLED') {
                return response()->json(['message' => 'Customers can only cancel orders'], 400);
            }
        }

        $order->update(['status' => $newStatus]);

        if ($newStatus === 'CONFIRMED') {
            $order->update(['confirmed_at' => now()]);
        } elseif ($newStatus === 'DELIVERED') {
            $order->update(['delivered_at' => now()]);
            $order->payment()->update(['status' => 'COMPLETED']);
            
            // Release shipper when order is delivered
            $order->load('shipper');
            if ($order->shipper) {
                $shipperService = new ShipperMatchingService();
                $shipperService->releaseShipper($order->shipper);
            }
        }

        // Load shipper relationship for notifications
        $order->load('shipper');

        // Send notifications about status change
        $webSocketService = new \App\Services\WebSocketService();
        $notificationService = new NotificationService($webSocketService);
        
        // Always notify customer
        $notificationService->notifyCustomerOrderStatus($order, $newStatus);
        
        // Notify shipper on CONFIRMED or CANCELLED
        if ($order->shipper && in_array($newStatus, ['CONFIRMED', 'CANCELLED'])) {
            $notificationService->notifyShipperOrderStatus($order->shipper, $order, $newStatus);
        }

        return response()->json([
            'message' => 'Order status updated successfully',
            'order' => $order,
        ]);
    }
}
