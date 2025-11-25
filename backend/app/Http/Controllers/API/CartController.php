<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\CartItem;
use App\Models\MenuItem;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function index(Request $request)
    {
        $cartItems = CartItem::with(['menuItem', 'restaurant'])
            ->where('user_id', $request->user()->id)
            ->get();

        return response()->json($cartItems);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'restaurant_id' => ['required', 'exists:restaurants,id'],
            'menu_item_id' => ['required', 'exists:menu_items,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'special_instructions' => ['nullable', 'string'],
        ]);

        // Check if user already has items from a different restaurant
        $existingCart = CartItem::where('user_id', $request->user()->id)
            ->where('restaurant_id', '!=', $validated['restaurant_id'])
            ->first();

        if ($existingCart) {
            return response()->json([
                'message' => 'Bạn chỉ có thể đặt món từ một nhà hàng tại một thời điểm!'
            ], 400);
        }

        $cartItem = CartItem::updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'menu_item_id' => $validated['menu_item_id'],
            ],
            [
                'restaurant_id' => $validated['restaurant_id'],
                'quantity' => $validated['quantity'],
                'special_instructions' => $validated['special_instructions'],
            ]
        );

        return response()->json($cartItem->load(['menuItem', 'restaurant']), 201);
    }

    public function update(Request $request, CartItem $cartItem)
    {
        // Verify ownership
        if ($cartItem->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:1'],
            'special_instructions' => ['nullable', 'string'],
        ]);

        $cartItem->update($validated);

        return response()->json($cartItem->load(['menuItem', 'restaurant']));
    }

    public function destroy(Request $request, CartItem $cartItem)
    {
        // Verify ownership
        if ($cartItem->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $cartItem->delete();

        return response()->json(['message' => 'Item removed from cart']);
    }

    public function clear(Request $request)
    {
        CartItem::where('user_id', $request->user()->id)->delete();

        return response()->json(['message' => 'Cart cleared']);
    }
}
