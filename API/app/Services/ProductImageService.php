<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class ProductImageService
{
    public function all(Product $product)
    {
        return $product->images()->get();
    }

    /**
     * @param UploadedFile[] $files
     */
    public function create(Product $product, array $files, int $position = 0)
    {
        $images = [];

        $nextPosition = (int) $product->images()->max('position') + 1;

        foreach ($files as $index => $file) {
            $path = $file->store("products/{$product->id}", 'public');

            $images[] = $product->images()->create([
                'path' => $path,
                'position' => $position > 0 ? $position + $index : $nextPosition + $index,
            ]);
        }

        return $images;
    }

    public function delete(Product $product, ProductImage $image): void
    {
        Storage::disk('public')->delete($image->path);
        $image->delete();
    }
}
