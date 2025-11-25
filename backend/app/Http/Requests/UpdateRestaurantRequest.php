<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRestaurantRequest extends FormRequest
{
    public function authorize(): bool
    {
        $restaurant = $this->route('restaurant');
        return $this->user() && $this->user()->id === $restaurant->owner_id;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'address' => ['sometimes', 'string'],
            'phone' => ['sometimes', 'string', 'max:20'],
            'image_url' => ['nullable', 'string', 'max:255'],
            'opening_time' => ['sometimes', 'date_format:H:i'],
            'closing_time' => ['sometimes', 'date_format:H:i'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
