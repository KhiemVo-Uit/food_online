<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMenuItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        $menuItem = $this->route('menuItem');
        return $this->user() && $this->user()->id === $menuItem->restaurant->owner_id;
    }

    public function rules(): array
    {
        return [
            'category_id' => ['nullable', 'exists:menu_categories,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'image_url' => ['nullable', 'string', 'max:255'],
            'is_available' => ['sometimes', 'boolean'],
        ];
    }
}
