<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public const MICROCONTROLLERS = 'Placas e Microcontroladores';
    public const SENSORS = 'Sensores';
    public const MOTORS = 'Motores e Drivers';
    public const MODULES = 'Módulos e Comunicação';
    public const PROTOTYPING = 'Componentes e Prototipagem';
    public const IOT = 'Internet of Things(IoT)';
    public const TOOLS = 'Ferramentas';
    public const TDPRINT = 'Impressão 3D';
    public const KITS = 'Kits';
    public const DISPLAYS = 'Displays e Telas';
    public const ROBOTICS = 'Robótica';

    public function run(): void
    {
        $now = now();

        foreach ([
            self::MICROCONTROLLERS,
            self::MOTORS,
            self::MODULES,
            self::PROTOTYPING,
            self::IOT,
            self::TOOLS,
            self::KITS,
            self::ROBOTICS
        ] as $name) {
            DB::table('categories')->insert([
                'name' => $name,
                'slug' => Str::slug($name),
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }
}
