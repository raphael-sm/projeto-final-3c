<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CartItemResource;
use App\Http\Resources\ShoppingCartResource;
use App\Services\CartItemService;
use App\Services\ProductService;
use App\Services\ShoppingCartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class CartController extends Controller
{
    public function __construct(
        private ShoppingCartService $carts,
        private CartItemService $items,
        private ProductService $products,
    ) {
    }

    /** GET /api/cart — resolves (and creates if needed) the shopper's cart. */
    public function show(Request $request): JsonResponse
    {
        $cart = $this->carts->resolveFor($request->user(), $request->input('guest_token'));

        $cart->load('items.product.images');

        return response()->json([
            'cart' => new ShoppingCartResource($cart),
            'items' => CartItemResource::collection($cart->items),
            'totals' => $this->carts->totals($cart),
        ]);
    }

    /** POST /api/cart/items — add a product (body: product_id, quantity). */
    public function addItem(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer', Rule::exists('products', 'id')],
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $cart = $this->carts->resolveFor($request->user(), $request->input('guest_token'));
        $product = $this->products->find($data['product_id']);

        $item = $this->items->addItem($cart, $product, $data['quantity']);

        return response()->json(new CartItemResource($item->load('product.images')), Response::HTTP_CREATED);
    }

    /** PATCH /api/cart/items/{item} — change quantity (body: quantity). */
    public function updateItem(Request $request, int|string $item): JsonResponse
    {
        $data = $request->validate([
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $cartItem = $this->items->find($item);
        $this->carts->assertCanManage($cartItem->cart, $request->user());

        $cartItem = $this->items->setQuantity($cartItem, $data['quantity']);

        return response()->json(new CartItemResource($cartItem->load('product.images')));
    }

    /** DELETE /api/cart/items/{item} — remove a single item. */
    public function removeItem(Request $request, int|string $item): Response
    {
        $cartItem = $this->items->find($item);
        $this->carts->assertCanManage($cartItem->cart, $request->user());

        $this->items->removeItem($cartItem);

        return response()->noContent();
    }

    /** DELETE /api/cart — empty the whole cart. */
    public function clear(Request $request): Response
    {
        $cart = $this->carts->resolveFor($request->user(), $request->input('guest_token'));

        $this->items->clearCart($cart);

        return response()->noContent();
    }

    /** POST /api/cart/merge — merge a guest cart into the user cart after login. */
    public function merge(Request $request): JsonResponse
    {
        if (! $request->user()) {
            abort(Response::HTTP_UNAUTHORIZED);
        }

        $cart = $this->carts->mergeGuestCart($request->user(), $request->input('guest_token'));
        $cart->load('items.product.images');

        return response()->json([
            'cart' => new ShoppingCartResource($cart),
            'items' => CartItemResource::collection($cart->items),
            'totals' => $this->carts->totals($cart),
        ]);
    }
}
