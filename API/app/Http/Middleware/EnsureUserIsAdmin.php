<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class EnsureUserIsAdmin
{
    public function handle(Request $request, Closure $next): SymfonyResponse
    {
        if (!$request->user() || $request->user()->role?->name !== 'admin') {
            abort(Response::HTTP_FORBIDDEN, 'Apenas administradores podem executar esta ação.');
        }

        return $next($request);
    }
}
