<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Gera imagens placeholder (PNG sólido) para cada produto seeded e as registra
 * em product_images. Os arquivos ficam no disco "public" (storage/app/public),
 * acessíveis publicamente em /storage/products/{id}/xxxx.png após:
 *   php artisan storage:link
 */
class ProductImageSeeder extends Seeder
{
    private const PALETTE = ['#2563eb', '#16a34a', '#dc2626', '#f59e0b', '#8b5cf6', '#0891b2'];

    public function run(): void
    {
        // Limpa arquivos e registros antigos antes de gerar tudo de novo.
        Storage::disk('public')->deleteDirectory('products');
        DB::table('product_images')->delete();

        $products = DB::table('products')->select('id', 'sku', 'deleted_at')->get();
        $now = now();

        foreach ($products as $product) {
            $color = self::PALETTE[$product->id % count(self::PALETTE)];

            foreach ([1, 2] as $position) {
                $fileName = $position.'_'.$product->sku.'.png';
                $path = "products/{$product->id}/{$fileName}";

                Storage::disk('public')->put(
                    $path,
                    $this->placeholderPng(640, 480, $color, mb_strimwidth($product->sku, 0, 16)),
                );

                DB::table('product_images')->insert([
                    'product_id' => $product->id,
                    'path' => $path,
                    'position' => $position - 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        $this->command?->info('Imagens de produto geradas: '.$products->count() * 2 . ' arquivos em storage/app/public/products.');
    }

    /**
     * Cria um PNG 8-bit RGB sólido com texto pseudo-desenhado no canto.
     * Sem dependência da extensão GD: monta os chunks PNG manualmente.
     */
    private function placeholderPng(int $width, int $height, string $hex, string $label): string
    {
        [$r, $g, $b] = [hexdec(substr($hex, 1, 2)), hexdec(substr($hex, 3, 2)), hexdec(substr($hex, 5, 2))];
        // Cor mais escura para a faixa do "rótulo".
        $dr = (int) max(0, $r - 50);
        $dg = (int) max(0, $g - 50);
        $db = (int) max(0, $b - 50);

        $labelRows = array_fill_keys(range($height - 60, $height - 40), true);

        $row = '';
        for ($x = 0; $x < $width; $x++) {
            $row .= pack('C3', $r, $g, $b);
        }
        $labelRow = '';
        for ($x = 0; $x < $width; $x++) {
            $labelRow .= pack('C3', $dr, $dg, $db);
        }

        $raw = '';
        for ($y = 0; $y < $height; $y++) {
            $raw .= "\x00".(isset($labelRows[$y]) ? $labelRow : $row);
        }

        $ihdr = pack('N2C5', $width, $height, 8, 2, 0, 0, 0);
        $idat = gzcompress($raw);

        $chunk = fn (string $type, string $data): string =>
            pack('N', strlen($data)).$type.$data.pack('N', crc32($type.$data));

        return "\x89PNG\r\n\x1a\n"
            .$chunk('IHDR', $ihdr)
            .$chunk('IDAT', $idat)
            .$chunk('IEND', '');
    }
}
