<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Services\OrderService;
use App\Services\ShoppingCartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;
use InvalidArgumentException;
use RuntimeException;

class CheckoutController extends Controller
{
    public function __construct(
        private OrderService $orders,
        private ShoppingCartService $carts,
    ) {
    }

    /** POST /api/checkout — body (optional): { address_id } or { address: "texto" }. */
    public function store(Request $request): JsonResponse
    {
        if (! $request->user()) {
            abort(Response::HTTP_UNAUTHORIZED, 'Faça login para finalizar a compra.');
        }

        $data = $request->validate([
            'address_id' => ['nullable', 'integer', Rule::exists('addresses', 'id')],
            'address' => ['nullable', 'string', 'max:255'],
        ]);

        $cart = $this->carts->resolveFor($request->user(), $request->input('guest_token'));

        try {
            $order = $this->orders->checkoutFromCart($cart, $request->user(), $data);
        } catch (RuntimeException|InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        return response()->json(new OrderResource($order), Response::HTTP_CREATED);
    }
}
