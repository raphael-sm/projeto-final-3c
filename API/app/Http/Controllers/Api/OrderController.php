<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Requests\UpdateOrderRequest;
use App\Http\Resources\OrderResource;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class OrderController extends Controller
{
    public function __construct(private OrderService $service)
    {
    }

    public function index(): JsonResponse
    {
        return response()->json(OrderResource::collection($this->service->all()));
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        $order = $this->service->create($request->validated());

        return response()->json(new OrderResource($order), Response::HTTP_CREATED);
    }

    public function show(int|string $id): JsonResponse
    {
        $order = $this->service->find($id);

        return response()->json(new OrderResource($order));
    }

    public function update(UpdateOrderRequest $request, int|string $id): JsonResponse
    {
        $order = $this->service->find($id);
        $order = $this->service->update($order, $request->validated());

        return response()->json(new OrderResource($order));
    }

    public function destroy(int|string $id): Response
    {
        $order = $this->service->find($id);
        $this->service->delete($order);

        return response()->noContent();
    }
}
