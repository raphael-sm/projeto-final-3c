<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    public const MICROCONTROLLERS = 'Placas e Microcontroladores';
    public const SENSORS = 'Sensores';
    public const MOTORS = 'Motores e Drivers';
    public const MODULES = 'Módulos e Comunicação';
    public const PROTOTYPING = 'Componentes e Prototipagem';

    public function run(): void
    {
        $now = now();

        foreach ([
            self::MICROCONTROLLERS,
            self::SENSORS,
            self::MOTORS,
            self::MODULES,
            self::PROTOTYPING,
        ] as $name) {
            DB::table('categories')->insert([
                'name' => $name,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }
}
