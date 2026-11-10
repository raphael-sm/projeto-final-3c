<?php

namespace Database\Seeders;

use App\Support\TaxId;
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

        // [nome, e-mail, senha, role, documento, aniversário, endereços]
        $users = [
            ['Administrador', self::ADMIN_EMAIL, self::ADMIN_PASSWORD, 'admin', TaxId::generateValidCnpj(), null, []],
            [
                'Maria Souza',
                'cliente1@portaleletro.test',
                self::CUSTOMER_PASSWORD,
                'regular',
                TaxId::generateValidCpf(),
                '1992-03-24',
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
                TaxId::generateValidCnpj(), // MEI-style customer
                null, // CNPJ: sem data de nascimento
                ['Rua das Palmeiras, 45, Boa Vista, Porto Alegre - RS, 90010-000'],
            ],
            [
                'Ana Oliveira',
                'cliente3@portaleletro.test',
                self::CUSTOMER_PASSWORD,
                'regular',
                TaxId::generateValidCpf(),
                '1995-07-19',
                ['Rua dos Ipês, 800, Trindade, Florianópolis - SC, 88036-000'],
            ],
        ];

        foreach ($users as [$name, $email, $password, $role, $document, $birthday, $addresses]) {
            $userId = DB::table('users')->insertGetId([
                'name' => $name,
                'email' => $email,
                'email_verified_at' => $now,
                'password' => Hash::make($password),
                'role_id' => $roles[$role],
                'cpf' => strlen($document) === 11 ? $document : null,
                'cnpj' => strlen($document) === 14 ? $document : null,
                'birthday' => $birthday,
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
