<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class AuthController extends Controller
{
    public function __construct(private AuthService $service)
    {
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        ['user' => $user, 'token' => $token] = $this->service->register($request->validated());

        return response()->json([
            'user' => new UserResource($user),
            'token' => $token,
        ], Response::HTTP_CREATED);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        ['user' => $user, 'token' => $token] = $this->service->login(
            $request->validated('email'),
            $request->validated('password'),
        );

        return response()->json([
            'user' => new UserResource($user),
            'token' => $token,
        ]);
    }

    public function logout(Request $request): Response
    {
        $this->service->logout($request->user());

        return response()->noContent();
    }

    public function me(Request $request): JsonResponse
    {
        // Endpoints de dados do titular: incluem o documento sem máscara (LGPD art. 18).
        return (new UserResource($request->user()->load('role')))->withRawDocument()->response();
    }

    /** PATCH/PUT /api/auth/me — update the authenticated user's profile. */
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $this->service->updateProfile($request->user(), $request->validated());

        return (new UserResource($user->load('role')))->withRawDocument()->response();
    }
}
