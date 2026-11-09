<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreShoppingCartRequest;
use App\Http\Requests\UpdateShoppingCartRequest;
use App\Http\Resources\ShoppingCartResource;
use App\Services\ShoppingCartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class ShoppingCartController extends Controller
{
    public function __construct(private ShoppingCartService $service)
    {
    }

    public function index(): JsonResponse
    {
        return response()->json(ShoppingCartResource::collection($this->service->all()));
    }

    public function store(StoreShoppingCartRequest $request): JsonResponse
    {
        $cart = $this->service->create($request->validated());

        return response()->json(new ShoppingCartResource($cart), Response::HTTP_CREATED);
    }

    public function show(int|string $id): JsonResponse
    {
        $cart = $this->service->find($id);

        return response()->json(new ShoppingCartResource($cart));
    }

    public function update(UpdateShoppingCartRequest $request, int|string $id): JsonResponse
    {
        $cart = $this->service->find($id);
        $cart = $this->service->update($cart, $request->validated());

        return response()->json(new ShoppingCartResource($cart));
    }

    public function destroy(int|string $id): Response
    {
        $cart = $this->service->find($id);

        $this->service->delete($cart);

        return response()->noContent();
    }
}
