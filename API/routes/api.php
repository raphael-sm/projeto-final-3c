<?php

use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProductImageController;
use Illuminate\Support\Facades\Route;

Route::get('categories', [CategoryController::class, 'index'])->whereNumber('category');
Route::get('categories/{category}', [CategoryController::class, 'show'])->whereNumber('category');

Route::get('products', [ProductController::class, 'index']);
Route::get('products/{product}', [ProductController::class, 'show'])->whereNumber('product');
Route::get('products/{product}/images', [ProductImageController::class, 'index'])
    ->whereNumber('product')->name('product-images.index');

Route::post('auth/register', [AuthController::class, 'register']);
Route::post('auth/login', [AuthController::class, 'login']);

// Guest + user cart browsing: resolveFor() handles both (optional auth).
// auth.optional makes $request->user() resolve from the Sanctum token when one
// is sent — without it, token-authenticated users are seen as guests here.
Route::middleware('auth.optional')->group(function () {
    Route::get('cart', [CartController::class, 'show']);
    Route::delete('cart', [CartController::class, 'clear']);
    Route::post('cart/items', [CartController::class, 'addItem']);
    Route::patch('cart/items/{item}', [CartController::class, 'updateItem'])->whereNumber('item');
    Route::delete('cart/items/{item}', [CartController::class, 'removeItem'])->whereNumber('item');
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('addresses', [AddressController::class, 'index']);

    // Automatic guest-cart transfer on login/registration.
    Route::post('cart/merge', [CartController::class, 'merge']);

    Route::post('checkout', [CheckoutController::class, 'store']);

    Route::get('orders', [OrderController::class, 'index']);
    Route::get('orders/{order}', [OrderController::class, 'show'])->whereNumber('order');
    Route::delete('orders/{order}', [OrderController::class, 'destroy'])->whereNumber('order');

    Route::middleware('admin')->group(function () {
        Route::post('categories', [CategoryController::class, 'store']);
        Route::put('categories/{category}', [CategoryController::class, 'update'])->whereNumber('category');
        Route::patch('categories/{category}', [CategoryController::class, 'update'])->whereNumber('category');
        Route::delete('categories/{category}', [CategoryController::class, 'destroy'])->whereNumber('category');

        Route::post('products', [ProductController::class, 'store']);
        Route::put('products/{product}', [ProductController::class, 'update'])->whereNumber('product');
        Route::patch('products/{product}', [ProductController::class, 'update'])->whereNumber('product');
        Route::delete('products/{product}', [ProductController::class, 'destroy'])->whereNumber('product');

        Route::post('products/{product}/images', [ProductImageController::class, 'store'])
            ->whereNumber('product')->name('product-images.store');
        Route::delete('products/{product}/images/{image}', [ProductImageController::class, 'destroy'])
            ->whereNumber('product')->whereNumber('image')->name('product-images.destroy');

        Route::put('orders/{order}', [OrderController::class, 'update'])->whereNumber('order');
        Route::patch('orders/{order}', [OrderController::class, 'update'])->whereNumber('order');
    });
});
