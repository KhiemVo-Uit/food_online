<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReviewRequest;
use App\Models\Restaurant;
use App\Models\Review;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(Restaurant $restaurant)
    {
        $reviews = Review::where('restaurant_id', $restaurant->id)
            ->with('customer')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json($reviews);
    }

    public function store(StoreReviewRequest $request)
    {
        // Check if order belongs to customer
        $order = \App\Models\Order::where('id', $request->order_id)
            ->where('customer_id', $request->user()->id)
            ->where('status', 'DELIVERED')
            ->firstOrFail();

        // Check if review already exists
        $existingReview = Review::where('order_id', $request->order_id)->first();
        if ($existingReview) {
            return response()->json([
                'message' => 'Review already exists for this order'
            ], 422);
        }

        $review = Review::create([
            'customer_id' => $request->user()->id,
            'restaurant_id' => $request->restaurant_id,
            'order_id' => $request->order_id,
            'rating' => $request->rating,
            'comment' => $request->comment,
        ]);

        // Update restaurant rating
        $this->updateRestaurantRating($request->restaurant_id);

        return response()->json([
            'message' => 'Review created successfully',
            'review' => $review,
        ], 201);
    }

    public function destroy(Review $review)
    {
        if ($review->customer_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $restaurantId = $review->restaurant_id;
        $review->delete();

        // Update restaurant rating
        $this->updateRestaurantRating($restaurantId);

        return response()->json([
            'message' => 'Review deleted successfully'
        ]);
    }

    private function updateRestaurantRating($restaurantId)
    {
        $avgRating = Review::where('restaurant_id', $restaurantId)->avg('rating');
        Restaurant::where('id', $restaurantId)->update(['rating' => $avgRating ?? 0]);
    }
}
