<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class OrderSeeder extends Seeder
{
    // Apenas 'pending_payment' é definido no schema (default da coluna);
    // os demais valores seguem o mesmo padrão. Ajuste aqui se o app usar outros.
    private const PENDING_PAYMENT = 'pending_payment';

    private const PAID = 'paid';

    private const SHIPPED = 'shipped';

    private const DELIVERED = 'delivered';

    private const CANCELLED = 'cancelled';

    public function run(): void
    {
        // [e-mail, status, criado há N dias, atualizado há N dias, itens]
        // Item: [sku, quantidade, preço pago (null = preço atual)]
        $orders = [
            ['cliente1@portaleletro.test', self::DELIVERED, 30, 24, [
                ['MCU-ESP32-DEV', 2, null],
                ['SEN-DHT22', 1, null],
                ['KIT-JUMPERS-120', 1, null],
                ['MCU-STM32-BLUEPILL', 1, null], // hoje com estoque zero
            ]],
            ['cliente1@portaleletro.test', self::PENDING_PAYMENT, 1, 1, [
                ['MCU-UNO-R3', 1, null],
                ['DRV-L298N', 2, null],
            ]],
            ['cliente2@portaleletro.test', self::PAID, 3, 2, [
                ['MOT-SERVO-MG996R', 2, null],
                ['DRV-A4988', 2, null],
            ]],
            ['cliente2@portaleletro.test', self::SHIPPED, 6, 4, [
                ['MCU-MEGA-2560', 1, null],
                ['MOT-NEMA17', 1, null],
                ['MOT-SERVO-SG90', 4, 14.90], // preço atual: 16.90
            ]],
            ['cliente3@portaleletro.test', self::CANCELLED, 12, 11, [
                ['COM-LORA-RA02', 1, null],
                ['COM-OLED-096', 1, null],
            ]],
            ['cliente3@portaleletro.test', self::DELIVERED, 20, 15, [
                ['KIT-CHASSI-2WD', 1, null],
                ['MOT-DC-TT', 2, null],
                ['DRV-TB6612FNG', 1, null],
                ['KIT-HOLDER-18650-2X', 2, null],
                ['COM-ETH-W5100', 1, null], // hoje inativo
            ]],
        ];

        foreach ($orders as [$email, $status, $createdDaysAgo, $updatedDaysAgo, $items]) {
            $createdAt = now()->subDays($createdDaysAgo);
            $updatedAt = now()->subDays($updatedDaysAgo);
            $userId = DB::table('users')->where('email', $email)->value('id');
            $address = DB::table('addresses')->where('user_id', $userId)->first();

            $orderId = DB::table('orders')->insertGetId([
                'status' => $status,
                'user_id' => $userId,
                'address_id' => $address?->id,
                'address_snapshot' => $address?->address,
                'created_at' => $createdAt,
                'updated_at' => $updatedAt,
            ]);

            foreach ($items as [$sku, $quantity, $price]) {
                $product = DB::table('products')->where('sku', $sku)->first(['id', 'name', 'price']);

                DB::table('order_items')->insert([
                    'order_id' => $orderId,
                    'product_id' => $product->id,
                    'name_snapshot' => $product->name,
                    'quantity' => $quantity,
                    'price' => $price ?? $product->price,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]);
            }
        }
    }
}
