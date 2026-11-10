<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Authenticates the request via Sanctum ONLY when a Bearer token is present;
 * otherwise the request continues unauthenticated (guest carts, public listing).
 *
 * Needed because routes outside the `auth:sanctum` group fall back to the
 * default `web` guard, so token-based users would appear as guests there.
 */
class AuthenticateOptional
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->bearerToken()) {
            $user = auth('sanctum')->user();

            if ($user) {
                $request->setUserResolver(fn () => $user);
            }
        }

        return $next($request);
    }
}
