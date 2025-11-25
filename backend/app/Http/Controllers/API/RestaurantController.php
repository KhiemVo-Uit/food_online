<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRestaurantRequest;
use App\Http\Requests\UpdateRestaurantRequest;
use App\Models\Restaurant;
use Illuminate\Http\Request;

class RestaurantController extends Controller
{
    public function index(Request $request)
    {
        $query = Restaurant::with(['owner', 'menuCategories', 'menuItems'])
            ->where('is_active', true);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $restaurants = $query->paginate(10);

        return response()->json($restaurants);
    }

    public function store(StoreRestaurantRequest $request)
    {
        $restaurant = Restaurant::create([
            'owner_id' => $request->user()->id,
            'name' => $request->name,
            'description' => $request->description,
            'address' => $request->address,
            'phone' => $request->phone,
            'image_url' => $request->image_url,
            'opening_time' => $request->opening_time,
            'closing_time' => $request->closing_time,
        ]);

        return response()->json([
            'message' => 'Restaurant created successfully',
            'restaurant' => $restaurant,
        ], 201);
    }

    public function show(Restaurant $restaurant)
    {
        $restaurant->load(['owner', 'menuCategories', 'menuItems', 'reviews.customer']);

        return response()->json($restaurant);
    }

    public function update(UpdateRestaurantRequest $request, Restaurant $restaurant)
    {
        $restaurant->update($request->validated());

        return response()->json([
            'message' => 'Restaurant updated successfully',
            'restaurant' => $restaurant,
        ]);
    }

    public function destroy(Restaurant $restaurant)
    {
        if ($restaurant->owner_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $restaurant->delete();

        return response()->json([
            'message' => 'Restaurant deleted successfully'
        ]);
    }

    public function myRestaurants(Request $request)
    {
        $restaurants = Restaurant::where('owner_id', $request->user()->id)
            ->with(['menuCategories', 'menuItems'])
            ->get();

        return response()->json($restaurants);
    }
}
