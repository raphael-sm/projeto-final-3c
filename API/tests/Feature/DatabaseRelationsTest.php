<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\ShoppingCart;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DatabaseRelationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeded_records_follow_the_required_relations_and_keep_snapshots(): void
    {
        $this->seed();

        $user = User::with([
            'shoppingCart.items.product.category',
            'orders.address',
            'orders.items.product',
            'addresses',
        ])->where('email', 'cliente1@portaleletro.test')->firstOrFail();

        $this->assertInstanceOf(ShoppingCart::class, $user->shoppingCart);
        $this->assertNotEmpty($user->shoppingCart->items);
        $this->assertNotEmpty($user->shoppingCart->items->first()->product->category->products);
        $this->assertNotEmpty($user->addresses);

        $order = $user->orders->first();

        $this->assertInstanceOf(Order::class, $order);
        $this->assertSame($order->address_snapshot, $order->address->address);
        $this->assertSame(
            $order->items->first()->name_snapshot,
            $order->items->first()->product->name
        );

        $orderItem = $order->items->first();
        $nameSnapshot = $orderItem->name_snapshot;
        $priceSnapshot = $orderItem->price;
        DB::table('products')->where('id', $orderItem->product_id)->delete();
        $orderItem->refresh();

        $this->assertNull($orderItem->product_id);
        $this->assertSame($nameSnapshot, $orderItem->name_snapshot);
        $this->assertSame($priceSnapshot, $orderItem->price);

        $addressSnapshot = $order->address_snapshot;
        DB::table('addresses')->where('id', $order->address_id)->delete();
        $order->refresh();

        $this->assertNull($order->address_id);
        $this->assertSame($addressSnapshot, $order->address_snapshot);
    }

    public function test_database_prevents_a_second_authenticated_cart_for_a_user(): void
    {
        $this->seed();

        $userId = DB::table('users')->where('email', 'cliente1@portaleletro.test')->value('id');

        $this->expectException(QueryException::class);

        DB::table('shopping_carts')->insert([
            'user_id' => $userId,
            'guest_token' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_guest_cart_requires_a_token_without_an_authenticated_user(): void
    {
        $this->seed();

        DB::table('shopping_carts')->insert([
            'user_id' => null,
            'guest_token' => 'guest-token',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->expectException(QueryException::class);

        DB::table('shopping_carts')->insert([
            'user_id' => null,
            'guest_token' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_database_prevents_duplicate_products_in_the_same_cart(): void
    {
        $this->seed();

        $item = DB::table('cart_items')->first();

        $this->expectException(QueryException::class);

        DB::table('cart_items')->insert([
            'cart_id' => $item->cart_id,
            'product_id' => $item->product_id,
            'quantity' => 1,
            'price_snapshot' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
