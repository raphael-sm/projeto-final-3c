<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public const ADMIN_EMAIL = 'admin@portaleletro.test';
    public const ADMIN_PASSWORD = 'Admin@12345';
    public const CUSTOMER_PASSWORD = 'Cliente@12345';

    public function run(): void
    {
        $now = now();
        $roles = DB::table('roles')->pluck('id', 'name');

        // [nome, e-mail, senha, role, endereços]
        $users = [
            ['Administrador', self::ADMIN_EMAIL, self::ADMIN_PASSWORD, 'admin', []],
            [
                'Maria Souza',
                'cliente1@portaleletro.test',
                self::CUSTOMER_PASSWORD,
                'regular',
                [
                    'Rua das Acácias, 120, Centro, Curitiba - PR, 80010-000',
                    'Av. Brasil, 2300, Jardim América, São Paulo - SP, 01430-001',
                ],
            ],
            [
                'João Pereira',
                'cliente2@portaleletro.test',
                self::CUSTOMER_PASSWORD,
                'regular',
                ['Rua das Palmeiras, 45, Boa Vista, Porto Alegre - RS, 90010-000'],
            ],
            [
                'Ana Oliveira',
                'cliente3@portaleletro.test',
                self::CUSTOMER_PASSWORD,
                'regular',
                ['Rua dos Ipês, 800, Trindade, Florianópolis - SC, 88036-000'],
            ],
        ];

        foreach ($users as [$name, $email, $password, $role, $addresses]) {
            $userId = DB::table('users')->insertGetId([
                'name' => $name,
                'email' => $email,
                'email_verified_at' => $now,
                'password' => Hash::make($password),
                'role_id' => $roles[$role],
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            foreach ($addresses as $address) {
                DB::table('addresses')->insert([
                    'user_id' => $userId,
                    'address' => $address,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }
}
