<?php

namespace App\Services;

use App\Models\CartItem;
use App\Models\Product;
use App\Models\ShoppingCart;
use Illuminate\Database\Eloquent\Collection;
use RuntimeException;

class CartItemService
{
    public function all(): Collection
    {
        return CartItem::with('product.images')->get();
    }

    public function find(int|string $id): CartItem
    {
        return CartItem::with('product')->findOrFail($id);
    }

    /**
     * Add a product to a cart. If it's already there, quantities are summed.
     * Validates stock and always takes the CURRENT product price as snapshot
     * (clients cannot dictate the price).
     *
     * @throws RuntimeException when stock is insufficient
     */
    public function addItem(ShoppingCart $cart, Product $product, int $quantity): CartItem
    {
        $existing = $cart->items()->where('product_id', $product->id)->first();
        $requested = ($existing?->quantity ?? 0) + $quantity;

        if ($requested > $product->stock) {
            throw new RuntimeException(
                "Estoque insuficiente para '{$product->name}' (disponível: {$product->stock})."
            );
        }

        if ($existing) {
            $existing->update(['quantity' => $requested, 'price_snapshot' => $product->price]);

            return $existing;
        }

        return $cart->items()->create([
            'product_id' => $product->id,
            'quantity' => $quantity,
            'price_snapshot' => $product->price,
        ]);
    }

    /**
     * Change the quantity of an item (and refresh its price snapshot).
     *
     * @throws RuntimeException when stock is insufficient or quantity < 1
     */
    public function setQuantity(CartItem $item, int $quantity): CartItem
    {
        if ($quantity < 1) {
            throw new RuntimeException('A quantidade mínima é 1.');
        }

        $product = $item->product;

        if ($quantity > $product->stock) {
            throw new RuntimeException(
                "Estoque insuficiente para '{$product->name}' (disponível: {$product->stock})."
            );
        }

        $item->update(['quantity' => $quantity, 'price_snapshot' => $product->price]);

        return $item;
    }

    public function removeItem(CartItem $item): void
    {
        $item->delete();
    }

    /** Remove everything from a cart. */
    public function clearCart(ShoppingCart $cart): void
    {
        $cart->items()->delete();
    }

    public function delete(CartItem $cartItem): void
    {
        $cartItem->delete();
    }
}
