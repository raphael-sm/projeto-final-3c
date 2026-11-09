<?php

namespace App\Services;

use App\Models\CartItem;
use Illuminate\Database\Eloquent\Collection;

class CartItemService
{
    public function all(): Collection
    {
        return CartItem::all();
    }

    public function find(int|string $id): CartItem
    {
        return CartItem::findOrFail($id);
    }

    public function create(array $data): CartItem
    {
        return CartItem::create($data);
    }

    public function update(CartItem $cartItem, array $data): CartItem
    {
        $cartItem->update($data);

        return $cartItem;
    }

    public function delete(CartItem $cartItem): void
    {
        $cartItem->delete();
    }
}
