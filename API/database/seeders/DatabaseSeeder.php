<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Popula o banco com dados de teste. Use em banco limpo:
     * php artisan migrate:fresh --seed
     */
    public function run(): void
    {
        if (app()->isProduction()) {
            $this->command->error('Os seeders de teste não rodam em produção.');

            return;
        }

        $this->call([
            RoleSeeder::class,
            UserSeeder::class,
            CategorySeeder::class,
            ProductSeeder::class,
            ShoppingCartSeeder::class,
            OrderSeeder::class,
        ]);
    }
}
