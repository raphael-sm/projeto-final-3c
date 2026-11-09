<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderItemRequest;
use App\Http\Requests\UpdateOrderItemRequest;
use App\Http\Resources\OrderItemResource;
use App\Services\OrderItemService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class OrderItemController extends Controller
{
    public function __construct(private OrderItemService $service)
    {
    }

    public function index(): JsonResponse
    {
        return response()->json(OrderItemResource::collection($this->service->all()));
    }

    public function store(StoreOrderItemRequest $request): JsonResponse
    {
        $orderItem = $this->service->create($request->validated());

        return response()->json(new OrderItemResource($orderItem), Response::HTTP_CREATED);
    }

    public function show(int|string $id): JsonResponse
    {
        $orderItem = $this->service->find($id);

        return response()->json(new OrderItemResource($orderItem));
    }

    public function update(UpdateOrderItemRequest $request, int|string $id): JsonResponse
    {
        $orderItem = $this->service->find($id);
        $orderItem = $this->service->update($orderItem, $request->validated());

        return response()->json(new OrderItemResource($orderItem));
    }

    public function destroy(int|string $id): Response
    {
        $orderItem = $this->service->find($id);
        $this->service->delete($orderItem);

        return response()->noContent();
    }
}
