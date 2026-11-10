<?php

namespace App\Services;

use App\Models\Order;
use App\Models\ShoppingCart;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use RuntimeException;

class OrderService
{
    /** Allowed lifecycle transitions: pending_payment -> paid -> shipped -> delivered. */
    private const TRANSITIONS = [
        'pending_payment' => ['paid'],
        'paid' => ['shipped'],
        'shipped' => ['delivered'],
        'delivered' => [],
    ];

    public function __construct(
        private ShoppingCartService $carts,
        private CartItemService $cartItems,
        private AddressService $addresses,
    ) {
    }

    public function all(): Collection
    {
        return Order::with('items.product.images')->get();
    }

    public function find(int|string $id): Order
    {
        return Order::with('items.product.images')->findOrFail($id);
    }

    /** Admins see all orders; regular users only their own. */
    public function visibleTo(User $user): Collection
    {
        if ($user->role?->name === 'admin') {
            return $this->all();
        }

        return Order::with('items.product.images')->where('user_id', $user->id)->get();
    }

    /** Same as above for a single order. */
    public function findVisibleTo(User $user, int|string $id): Order
    {
        $order = $this->find($id);

        if ($user->role?->name !== 'admin' && $order->user_id !== $user->id) {
            throw new RuntimeException('Você não tem acesso a este pedido.');
        }

        return $order;
    }

    /**
     * Checkout: turns a shopping cart into an order inside a single DB transaction.
     *
     * Business rules enforced here:
     *  - cart must not be empty;
     *  - every item is re-checked against live product stock;
     *  - the order gets the CURRENT product price (never the stale cart snapshot);
     *  - product name and the chosen address are snapshotted;
     *  - stock is decremented and the cart is emptied.
     *
     * @param  array{id?: int, address?: string}|null  $shippingAddress
     *
     * @throws RuntimeException|InvalidArgumentException
     */
    public function checkoutFromCart(ShoppingCart $cart, User $user, ?array $shippingAddress = null): Order
    {
        $cart->load('items.product');

        if ($cart->items->isEmpty()) {
            throw new RuntimeException('O carrinho está vazio.');
        }

        if ($shippingAddress !== null && isset($shippingAddress['id'])) {
            $address = $this->addresses->find($shippingAddress['id']);
            $this->addresses->assertOwnedBy($address, $user);
            $shippingAddress = ['address' => $address->address];
        }

        return DB::transaction(function () use ($cart, $user, $shippingAddress) {
            // Lock product rows so concurrent checkouts can't oversell the same stock.
            $products = collect();

            foreach ($cart->items as $item) {
                $locked = $item->product->newQuery()
                    ->whereKey($item->product_id)
                    ->lockForUpdate()
                    ->first();

                if ($locked->stock < $item->quantity) {
                    throw new RuntimeException(
                        "Estoque insuficiente para '{$locked->name}' (disponível: {$locked->stock})."
                    );
                }

                $products->put($item->product_id, $locked);
            }

            $order = Order::create([
                'status' => 'pending_payment',
                'user_id' => $user->id,
                'address_snapshot' => $shippingAddress['address'] ?? null,
            ]);

            foreach ($cart->items as $item) {
                $product = $products[$item->product_id];

                $order->items()->create([
                    'product_id' => $product->id,
                    'name_snapshot' => $product->name,
                    'quantity' => $item->quantity,
                    'price' => $product->price,
                ]);

                $product->decrement('stock', $item->quantity);
            }

            $this->cartItems->clearCart($cart);

            return $order->load('items.product.images');
        });
    }

    /** Transition an order along its lifecycle (admins only in practice). */
    public function transitionStatus(Order $order, string $newStatus): Order
    {
        $allowed = self::TRANSITIONS[$order->status] ?? [];

        if (! in_array($newStatus, $allowed, true)) {
            throw new InvalidArgumentException(
                "Transição inválida: '{$order->status}' não pode ir para '{$newStatus}'."
            );
        }

        $order->update(['status' => $newStatus]);

        return $order;
    }

    /** Cancel an order and put the items back into stock. */
    public function cancel(Order $order): Order
    {
        if (! in_array($order->status, ['pending_payment', 'paid'], true)) {
            throw new RuntimeException("Pedidos '{$order->status}' não podem ser cancelados.");
        }

        DB::transaction(function () use ($order) {
            foreach ($order->items as $item) {
                $item->product()?->increment('stock', $item->quantity);
            }

            $order->update(['status' => 'cancelled']);
        });

        return $order;
    }

    public function delete(Order $order): void
    {
        $order->delete();
    }
}
