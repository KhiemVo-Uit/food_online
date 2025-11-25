<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMenuItemRequest;
use App\Http\Requests\UpdateMenuItemRequest;
use App\Models\MenuItem;
use App\Models\Restaurant;
use Illuminate\Http\Request;

class MenuItemController extends Controller
{
    public function index(Restaurant $restaurant)
    {
        $menuItems = MenuItem::where('restaurant_id', $restaurant->id)
            ->with('category')
            ->get();

        return response()->json($menuItems);
    }

    public function store(StoreMenuItemRequest $request)
    {
        $restaurant = Restaurant::findOrFail($request->restaurant_id);

        if ($restaurant->owner_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $menuItem = MenuItem::create($request->validated());

        return response()->json([
            'message' => 'Menu item created successfully',
            'menu_item' => $menuItem,
        ], 201);
    }

    public function show(MenuItem $menuItem)
    {
        $menuItem->load(['restaurant', 'category']);

        return response()->json($menuItem);
    }

    public function update(UpdateMenuItemRequest $request, MenuItem $menuItem)
    {
        $menuItem->update($request->validated());

        return response()->json([
            'message' => 'Menu item updated successfully',
            'menu_item' => $menuItem,
        ]);
    }

    public function destroy(MenuItem $menuItem)
    {
        if ($menuItem->restaurant->owner_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $menuItem->delete();

        return response()->json([
            'message' => 'Menu item deleted successfully'
        ]);
    }
}
