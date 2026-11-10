<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ShoppingCart;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;
use RuntimeException;

class ShoppingCartService
{
    public function __construct(private CartItemService $cartItems)
    {
    }

    public function all(): Collection
    {
        return ShoppingCart::with('items.product.images')->get();
    }

    public function find(int|string $id): ShoppingCart
    {
        return ShoppingCart::with('items.product.images')->findOrFail($id);
    }

    /**
     * Resolve the cart for the current shopper:
     * - logged-in users get their personal cart (created on demand);
     * - guests get a cart bound to a guest_token (sent by the frontend).
     */
    public function resolveFor(?User $user, ?string $guestToken): ShoppingCart
    {
        if ($user) {
            return $user->shoppingCart()->with('items.product.images')->first()
                ?? $user->shoppingCart()->create();
        }

        $cart = ShoppingCart::where('guest_token', $guestToken)->with('items.product.images')->first();

        return $cart ?? ShoppingCart::create(['guest_token' => $guestToken ?: (string) Str::uuid()]);
    }

    /**
     * Merge a guest cart into the user's cart after login/registration
     * (same product = sum quantities, keeping the newest price snapshot).
     */
    public function mergeGuestCart(User $user, ?string $guestToken): ShoppingCart
    {
        $target = $this->resolveFor($user, null);

        if ($guestToken && ($guest = ShoppingCart::where('guest_token', $guestToken)->first())) {
            foreach ($guest->items as $item) {
                $this->cartItems->addItem($target, $item->product, $item->quantity);
            }

            $guest->delete();
        }

        return $target->refresh();
    }

    /** Ownership guard: admins see everything, users only their own carts. */
    public function assertCanManage(ShoppingCart $cart, ?User $user): void
    {
        if ($user && $user->role?->name === 'admin') {
            return;
        }

        $owns = $user && $cart->user_id === $user->id;
        $ownsAsGuest = !$user && $cart->user_id === null;

        if (!$owns && !$ownsAsGuest) {
            throw new RuntimeException('Você não tem acesso a este carrinho.');
        }
    }

    public function delete(ShoppingCart $cart): void
    {
        $cart->delete();
    }

    /** Items total (price snapshot × quantity) for the cart. */
    public function totals(ShoppingCart $cart): array
    {
        $subtotal = 0;
        $count = 0;

        foreach ($cart->items as $item) {
            $subtotal += $item->price_snapshot * $item->quantity;
            $count += $item->quantity;
        }

        return [
            'items_count' => $count,
            'subtotal' => round($subtotal, 2),
        ];
    }
}
