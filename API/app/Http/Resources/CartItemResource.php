<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'cart_id' => $this->cart_id,
            'product_id' => $this->product_id,
            'quantity' => $this->quantity,
            'price_snapshot' => $this->price_snapshot,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            // Dados do produto para que o frontend remonte o carrinho após login.
            'product' => $this->whenLoaded('product', fn () => [
                'id' => $this->product->id,
                'sku' => $this->product->sku,
                'name' => $this->product->name,
                'price' => (float) $this->product->price,
                'full_price' => (float) $this->product->price,
                'stock' => (int) $this->product->stock,
                'image' => $this->product->images
                    ->sortBy('position')
                    ->first()?->url ?? '',
            ]),
        ];
    }
}
