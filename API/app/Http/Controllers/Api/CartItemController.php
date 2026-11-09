<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCartItemRequest;
use App\Http\Requests\UpdateCartItemRequest;
use App\Http\Resources\CartItemResource;
use App\Services\CartItemService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class CartItemController extends Controller
{
    public function __construct(private CartItemService $service)
    {
    }

    public function index(): JsonResponse
    {
        return response()->json(CartItemResource::collection($this->service->all()));
    }

    public function store(StoreCartItemRequest $request): JsonResponse
    {
        $cartItem = $this->service->create($request->validated());

        return response()->json(new CartItemResource($cartItem), Response::HTTP_CREATED);
    }

    public function show(int|string $id): JsonResponse
    {
        $cartItem = $this->service->find($id);

        return response()->json(new CartItemResource($cartItem));
    }

    public function update(UpdateCartItemRequest $request, int|string $id): JsonResponse
    {
        $cartItem = $this->service->find($id);
        $cartItem = $this->service->update($cartItem, $request->validated());

        return response()->json(new CartItemResource($cartItem));
    }

    public function destroy(int|string $id): Response
    {
        $cartItem = $this->service->find($id);

        $this->service->delete($cartItem);

        return response()->noContent();
    }
}
