<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Product extends Model
{
    protected $fillable = [
        'sku',
        'name',
        'about',
        'specs',
        'price',
        'stock',
        'rating',
        'category_id',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function shoppingCarts(): BelongsToMany
    {
        return $this->belongsToMany(ShoppingCart::class, 'cart_items', 'product_id', 'cart_id')
            ->withPivot('quantity', 'price_snapshot')
            ->withTimestamps();
    }

    public function orders(): BelongsToMany
    {
        return $this->belongsToMany(Order::class, 'order_items', 'product_id', 'order_id')
            ->withPivot('quantity', 'price')
            ->withTimestamps();
    }
}
