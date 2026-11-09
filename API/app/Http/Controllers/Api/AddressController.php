<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAddressRequest;
use App\Http\Requests\UpdateAddressRequest;
use App\Http\Resources\AddressResource;
use App\Services\AddressService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class AddressController extends Controller
{
    public function __construct(private AddressService $service)
    {
    }

    public function index(): JsonResponse
    {
        return response()->json(AddressResource::collection($this->service->all()));
    }

    public function store(StoreAddressRequest $request): JsonResponse
    {
        $address = $this->service->create($request->validated());

        return response()->json(new AddressResource($address), Response::HTTP_CREATED);
    }

    public function show(int|string $id): JsonResponse
    {
        $address = $this->service->find($id);

        return response()->json(new AddressResource($address));
    }

    public function update(UpdateAddressRequest $request, int|string $id): JsonResponse
    {
        $address = $this->service->find($id);
        $address = $this->service->update($address, $request->validated());

        return response()->json(new AddressResource($address));
    }

    public function destroy(int|string $id): Response
    {
        $address = $this->service->find($id);

        $this->service->delete($address);

        return response()->noContent();
    }
}
