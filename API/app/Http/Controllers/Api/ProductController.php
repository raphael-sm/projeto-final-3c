<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class ProductController extends Controller
{
    public function __construct(private ProductService $service)
    {
    }

    public function index(): JsonResponse
    {
        return response()->json(ProductResource::collection($this->service->all()));
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $product = $this->service->create($request->validated());

        return response()->json(new ProductResource($product), Response::HTTP_CREATED);
    }

    public function show(int|string $id): JsonResponse
    {
        $product = $this->service->find($id);

        return response()->json(new ProductResource($product));
    }

    public function update(UpdateProductRequest $request, int|string $id): JsonResponse
    {
        $product = $this->service->find($id);
        $product = $this->service->update($product, $request->validated());

        return response()->json(new ProductResource($product));
    }

    public function destroy(int|string $id): Response
    {
        $product = $this->service->find($id);

        $this->service->delete($product);

        return response()->noContent();
    }
}
