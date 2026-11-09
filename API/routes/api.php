<?php

use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\CartItemController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\OrderItemController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProductImageController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\ShoppingCartController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::apiResource('categories', CategoryController::class)->whereNumber('category');
Route::apiResource('products', ProductController::class)->whereNumber('product');
Route::apiResource('carts', ShoppingCartController::class)->whereNumber('cart');
Route::apiResource('cart-items', CartItemController::class)->whereNumber('cartItem');
Route::apiResource('orders', OrderController::class)->whereNumber('order');
Route::apiResource('order-items', OrderItemController::class)->whereNumber('orderItem');
Route::apiResource('addresses', AddressController::class)->whereNumber('address');
Route::apiResource('roles', RoleController::class)->whereNumber('role');

Route::post('products/{product}/images', [ProductImageController::class, 'store'])
    ->whereNumber('product')->name('product-images.store');
Route::get('products/{product}/images', [ProductImageController::class, 'index'])
    ->whereNumber('product')->name('product-images.index');
Route::delete('products/{product}/images/{image}', [ProductImageController::class, 'destroy'])
    ->whereNumber('product')->whereNumber('image')->name('product-images.destroy');
