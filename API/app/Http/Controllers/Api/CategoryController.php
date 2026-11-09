<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Services\CategoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class CategoryController extends Controller
{
    public function __construct(private CategoryService $service)
    {
    }

    public function index(): JsonResponse
    {
        return response()->json(CategoryResource::collection($this->service->all()));
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $category = $this->service->create($request->validated());

        return response()->json(new CategoryResource($category), Response::HTTP_CREATED);
    }

    public function show(int|string $id): JsonResponse
    {
        $category = $this->service->find($id);

        return response()->json(new CategoryResource($category));
    }

    public function update(UpdateCategoryRequest $request, int|string $id): JsonResponse
    {
        $category = $this->service->find($id);
        $category = $this->service->update($category, $request->validated());

        return response()->json(new CategoryResource($category));
    }

    public function destroy(int|string $id): Response
    {
        $category = $this->service->find($id);

        $this->service->delete($category);

        return response()->noContent();
    }
}
