<?php

namespace App\Http\Requests;

class UpdateCartItemRequest extends StoreCartItemRequest
{
    public function rules(): array
    {
        return [
            'cart_id' => ['sometimes', 'required', 'integer', 'exists:shopping_carts,id'],
            'product_id' => ['sometimes', 'required', 'integer', 'exists:products,id'],
            'quantity' => ['sometimes', 'required', 'integer', 'min:1'],
            'price_snapshot' => ['sometimes', 'required', 'numeric', 'min:0', 'decimal:0,2'],
        ];
    }
}
