<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;
use InvalidArgumentException;
use RuntimeException;

class OrderController extends Controller
{
    public function __construct(private OrderService $service)
    {
    }

    /** Admins see all orders; users only their own. */
    public function index(Request $request): JsonResponse
    {
        return response()->json(OrderResource::collection($this->service->visibleTo($request->user())));
    }

    public function show(Request $request, int|string $id): JsonResponse
    {
        try {
            $order = $this->service->findVisibleTo($request->user(), $id);
        } catch (RuntimeException $e) {
            abort(Response::HTTP_FORBIDDEN, $e->getMessage());
        }

        return response()->json(new OrderResource($order));
    }

    /** Admin-only lifecycle transition: body { status: paid|shipped|delivered }. */
    public function update(Request $request, int|string $id): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'string', Rule::in(['paid', 'shipped', 'delivered'])],
        ]);

        try {
            $order = $this->service->transitionStatus($this->service->find($id), $data['status']);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        return response()->json(new OrderResource($order));
    }

    /** User cancels own order (restores stock); admin can cancel any cancellable order. */
    public function destroy(Request $request, int|string $id): Response
    {
        try {
            $order = $this->service->findVisibleTo($request->user(), $id);
            $this->service->cancel($order);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        return response()->noContent();
    }
}
