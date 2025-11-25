<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'in:PENDING,CONFIRMED,COOKING,PICKING_UP,DELIVERING,DELIVERED,CANCELLED'],
        ];
    }
}
