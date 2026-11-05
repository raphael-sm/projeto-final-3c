<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Apenas carrinhos de usuários autenticados (user_id), sem carrinhos de visitante.
 *
 *  - cliente1: carrinho saudável, todos os itens disponíveis
 *  - cliente2: carrinho com casos de borda (estoque zero, produto inativo,
 *              quantidade acima do estoque e preço que mudou desde que foi adicionado)
 *  - cliente3: sem carrinho (permite testar a criação do carrinho)
 */
class ShoppingCartSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $carts = [
            'cliente1@portaleletro.test' => [
                // [sku, quantidade, price_snapshot (null = preço atual)]
                ['MCU-UNO-R3', 1, null],
                ['SEN-HCSR04', 4, null],
                ['KIT-PROTOBOARD-830', 1, null],
            ],
            'cliente2@portaleletro.test' => [
                ['DRV-L298N', 1, null],
                ['MCU-STM32-BLUEPILL', 1, null],  // estoque zero
                ['COM-ETH-W5100', 1, null],       // produto inativo
                ['SEN-BMP280', 5, null],          // estoque disponível: 2
                ['MOT-SERVO-SG90', 2, 14.90],     // preço atual: 16.90
            ],
        ];

        foreach ($carts as $email => $items) {
            $cartId = DB::table('shopping_carts')->insertGetId([
                'user_id' => DB::table('users')->where('email', $email)->value('id'),
                'guest_token' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            foreach ($items as [$sku, $quantity, $snapshot]) {
                $product = DB::table('products')->where('sku', $sku)->first(['id', 'price']);

                DB::table('cart_items')->insert([
                    'cart_id' => $cartId,
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'price_snapshot' => $snapshot ?? $product->price,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }
}
