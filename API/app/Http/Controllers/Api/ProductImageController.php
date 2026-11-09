<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductImageRequest;
use App\Http\Resources\ProductImageResource;
use App\Models\Product;
use App\Models\ProductImage;
use App\Services\ProductImageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class ProductImageController extends Controller
{
    public function __construct(private ProductImageService $service)
    {
    }

    public function index(int|string $productId): JsonResponse
    {
        $product = Product::findOrFail($productId);

        return response()->json(ProductImageResource::collection($this->service->all($product)));
    }

    public function store(StoreProductImageRequest $request, int|string $productId): JsonResponse
    {
        $product = Product::findOrFail($productId);

        $images = $this->service->create(
            $product,
            $request->file('images'),
            (int) $request->validated('position', 0),
        );

        return response()->json(ProductImageResource::collection($images), Response::HTTP_CREATED);
    }

    public function destroy(int|string $productId, int|string $image): Response
    {
        $product = Product::findOrFail($productId);
        $image = $product->images()->findOrFail($image);

        $this->service->delete($product, $image);

        return response()->noContent();
    }
}
