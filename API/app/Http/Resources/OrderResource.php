<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'user_id' => $this->user_id,
            'address_snapshot' => $this->address_snapshot,
            'carrier' => $this->carrier,
            'shipping_price' => $this->shipping_price,
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'total' => $this->whenLoaded('items', fn () => round(
                $this->items->sum(fn ($item) => $item->price * $item->quantity) + (float) $this->shipping_price,
                2
            )),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
