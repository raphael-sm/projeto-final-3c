<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductImage extends Model
{
    protected $fillable = [
        'product_id',
        'path',
        'position',
    ];

    protected $appends = [
        'url',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function getUrlAttribute(): string
    {
        $disk = config('filesystems.default') === 's3' ? config('filesystems.default') : 'public';

        $path = $this->path;

        // URLs absolutas externas passam intactas.
        if (Str::startsWith($path, ['http://', 'https://'])) {
            return $path;
        }

        // Caminho relativo: devolve "/storage/..." (sem host) para que a imagem
        // seja servida pelo mesmo domínio da loja (através do proxy), e não
        // pela porta interna da API (ex.: :8000) inacessível ao navegador.
        $relative = Storage::disk($disk)->url($path);

        return '/' . ltrim(preg_replace('#^https?://[^/]+#', '', $relative), '/');
    }
}
