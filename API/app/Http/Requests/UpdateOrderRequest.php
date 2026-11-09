<?php

namespace App\Http\Requests;

class UpdateOrderRequest extends StoreOrderRequest
{
    public function rules(): array
    {
        return [
            'status' => ['sometimes', 'required', 'string', 'max:255'],
            'user_id' => ['sometimes', 'required', 'integer', 'exists:users,id'],
        ];
    }
}
