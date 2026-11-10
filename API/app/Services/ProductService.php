<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;
use RuntimeException;

class ProductService
{
    public function all(): Collection
    {
        return Product::with('images')->get();
    }

    /** Catalogue listing with filters (search term, category) + eager images. */
    public function catalog(?string $search = null, ?int $categoryId = null): Collection
    {
        return Product::query()
            ->with('images')
            ->when($search, fn ($q) => $q->where(fn ($w) => $w
                ->where('name', 'ilike', "%{$search}%")
                ->orWhere('manufacturer', 'ilike', "%{$search}%")))
            ->when($categoryId, fn ($q) => $q->where('category_id', $categoryId))
            ->orderBy('name')
            ->get();
    }

    public function find(int|string $id): Product
    {
        return Product::with('images')->findOrFail($id);
    }

    public function create(array $data): Product
    {
        return Product::create($data);
    }

    public function update(Product $product, array $data): Product
    {
        $product->update($data);

        return $product;
    }

    public function delete(Product $product): void
    {
        $product->delete();
    }

    /** Sellable check used before adding to cart. */
    public function ensureInStock(Product $product, int $quantity): void
    {
        if ($product->stock < $quantity) {
            throw new RuntimeException(
                "Estoque insuficiente para '{$product->name}' (disponível: {$product->stock})."
            );
        }
    }
}
