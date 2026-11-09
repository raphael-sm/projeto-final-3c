<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = [
        'sku',
        'name',
        'about',
        'specs',
        'manufacturer',
        'price',
        'stock',
        'rating',
        'category_id',
    ];

    protected $casts = [
        'specs' => 'array'
    ];

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('position');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
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
            ->withPivot('quantity', 'price', 'name_snapshot')
            ->withTimestamps();
    }
}
