<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/produtos', function (Request $request) {
    return $request->products();
});

Route::get('/categorias', function (Request $request) {
    return $request->categories();
});