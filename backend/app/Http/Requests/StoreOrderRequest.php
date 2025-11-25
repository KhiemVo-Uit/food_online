<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->role === 'CUSTOMER';
    }

    public function rules(): array
    {
        return [
            'restaurant_id' => ['required', 'exists:restaurants,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.menu_item_id' => ['required', 'exists:menu_items,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.special_instructions' => ['nullable', 'string'],
            'delivery_address' => ['required', 'string'],
            'customer_latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'customer_longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'customer_phone' => ['required', 'string', 'max:20'],
            'notes' => ['nullable', 'string'],
            'payment_method' => ['required', 'in:CASH,CREDIT_CARD,DEBIT_CARD,E_WALLET'],
        ];
    }
}
