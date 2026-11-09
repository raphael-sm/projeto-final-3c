<?php

namespace App\Services;

use App\Models\OrderItem;
use Illuminate\Database\Eloquent\Collection;

class OrderItemService
{
    public function all(): Collection
    {
        return OrderItem::all();
    }

    public function find(int|string $id): OrderItem
    {
        return OrderItem::findOrFail($id);
    }

    public function create(array $data): OrderItem
    {
        return OrderItem::create($data);
    }

    public function update(OrderItem $orderItem, array $data): OrderItem
    {
        $orderItem->update($data);

        return $orderItem;
    }

    public function delete(OrderItem $orderItem): void
    {
        $orderItem->delete();
    }
}
