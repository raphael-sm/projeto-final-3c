<?php

namespace App\Http\Requests;

class UpdateOrderItemRequest extends StoreOrderItemRequest
{
    public function rules(): array
    {
        return [
            'order_id' => ['sometimes', 'required', 'integer', 'exists:orders,id'],
            'product_id' => ['nullable', 'integer', 'exists:products,id'],
            'name_snapshot' => ['sometimes', 'required', 'string', 'max:255'],
            'quantity' => ['sometimes', 'required', 'integer', 'min:1'],
            'price' => ['sometimes', 'required', 'numeric', 'min:0', 'decimal:0,2'],
        ];
    }
}
