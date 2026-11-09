<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRoleRequest;
use App\Http\Requests\UpdateRoleRequest;
use App\Http\Resources\RoleResource;
use App\Services\RoleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class RoleController extends Controller
{
    public function __construct(private RoleService $service)
    {
    }

    public function index(): JsonResponse
    {
        return response()->json(RoleResource::collection($this->service->all()));
    }

    public function store(StoreRoleRequest $request): JsonResponse
    {
        $role = $this->service->create($request->validated());

        return response()->json(new RoleResource($role), Response::HTTP_CREATED);
    }

    public function show(int|string $id): JsonResponse
    {
        $role = $this->service->find($id);

        return response()->json(new RoleResource($role));
    }

    public function update(UpdateRoleRequest $request, int|string $id): JsonResponse
    {
        $role = $this->service->find($id);
        $role = $this->service->update($role, $request->validated());

        return response()->json(new RoleResource($role));
    }

    public function destroy(int|string $id): Response
    {
        $role = $this->service->find($id);

        $this->service->delete($role);

        return response()->noContent();
    }
}
