<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAddressRequest;
use App\Http\Requests\UpdateAddressRequest;
use App\Http\Resources\AddressResource;
use App\Services\AddressService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use RuntimeException;

class AddressController extends Controller
{
    public function __construct(private AddressService $service)
    {
    }

    /** LGPD: returns only the addresses of the authenticated user. */
    public function index(Request $request): JsonResponse
    {
        return response()->json(AddressResource::collection(
            $this->service->visibleTo($request->user())
        ));
    }

    public function store(StoreAddressRequest $request): JsonResponse
    {
        try {
            $address = $this->service->create($request->user(), $request->validated());
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        return response()->json(new AddressResource($address), Response::HTTP_CREATED);
    }

    public function show(Request $request, int|string $id): JsonResponse
    {
        $address = $this->service->findOwnedBy($id, $request->user());

        return response()->json(new AddressResource($address));
    }

    public function update(UpdateAddressRequest $request, int|string $id): JsonResponse
    {
        $address = $this->service->findOwnedBy($id, $request->user());
        $address = $this->service->update($address, $request->validated());

        return response()->json(new AddressResource($address));
    }

    public function destroy(Request $request, int|string $id): Response
    {
        $address = $this->service->findOwnedBy($id, $request->user());

        $this->service->delete($address);

        return response()->noContent();
    }
}
