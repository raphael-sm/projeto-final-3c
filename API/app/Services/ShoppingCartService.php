<?php

namespace App\Services;

use App\Models\ShoppingCart;
use Illuminate\Database\Eloquent\Collection;

class ShoppingCartService
{
    public function all(): Collection
    {
        return ShoppingCart::all();
    }

    public function find(int|string $id): ShoppingCart
    {
        return ShoppingCart::findOrFail($id);
    }

    public function create(array $data): ShoppingCart
    {
        return ShoppingCart::create($data);
    }

    public function update(ShoppingCart $cart, array $data): ShoppingCart
    {
        $cart->update($data);

        return $cart;
    }

    public function delete(ShoppingCart $cart): void
    {
        $cart->delete();
    }
}
