<?php

use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\CartController;
use App\Http\Controllers\API\RestaurantController;
use App\Http\Controllers\API\MenuItemController;
use App\Http\Controllers\API\OrderController;
use App\Http\Controllers\API\ReviewController;
use App\Http\Controllers\API\ShipperController;
use App\Http\Controllers\API\NotificationController;
use App\Http\Controllers\API\TrackingController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Public restaurant and menu routes
Route::get('/restaurants', [RestaurantController::class, 'index']);
Route::get('/restaurants/{restaurant}', [RestaurantController::class, 'show']);
Route::get('/restaurants/{restaurant}/menu', [MenuItemController::class, 'index']);
Route::get('/restaurants/{restaurant}/reviews', [ReviewController::class, 'index']);
Route::get('/menu-items/{menuItem}', [MenuItemController::class, 'show']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Restaurant routes (for restaurant owners)
    Route::get('/my-restaurants', [RestaurantController::class, 'myRestaurants']);
    Route::post('/restaurants', [RestaurantController::class, 'store']);
    Route::put('/restaurants/{restaurant}', [RestaurantController::class, 'update']);
    Route::delete('/restaurants/{restaurant}', [RestaurantController::class, 'destroy']);

    // Menu item routes (for restaurant owners)
    Route::post('/menu-items', [MenuItemController::class, 'store']);
    Route::put('/menu-items/{menuItem}', [MenuItemController::class, 'update']);
    Route::delete('/menu-items/{menuItem}', [MenuItemController::class, 'destroy']);

    // Cart routes
    Route::get('/cart', [CartController::class, 'index']);
    Route::post('/cart', [CartController::class, 'store']);
    Route::put('/cart/{cartItem}', [CartController::class, 'update']);
    Route::delete('/cart/{cartItem}', [CartController::class, 'destroy']);
    Route::delete('/cart', [CartController::class, 'clear']);

    // Order routes
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{order}', [OrderController::class, 'show']);
    Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus']);

    // Review routes
    Route::post('/reviews', [ReviewController::class, 'store']);
    Route::delete('/reviews/{review}', [ReviewController::class, 'destroy']);

    // Shipper routes
    Route::get('/shipper/profile', [ShipperController::class, 'getProfile']);
    Route::patch('/shipper/location', [ShipperController::class, 'updateLocation']);
    Route::patch('/shipper/status', [ShipperController::class, 'updateStatus']);

    // Notification routes
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread', [NotificationController::class, 'unread']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);

    // Tracking routes (real-time location)
    Route::post('/orders/{order}/location', [TrackingController::class, 'updateLocation']);
    Route::post('/orders/{order}/customer-location', [TrackingController::class, 'updateCustomerLocation']);
    Route::get('/orders/{order}/location', [TrackingController::class, 'getLocation']);
});
