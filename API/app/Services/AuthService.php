<?php

namespace App\Services;

use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function __construct(private RoleService $roleService)
    {
    }

    /**
     * Register a new user. Everyone starts as a regular user ("regular" role).
     * Only the admin seeder creates admins — registration never accepts a role.
     */
    public function register(array $data): array
    {
        $role = $this->roleService->findByName('regular');

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role_id' => $role->id,
            // Exactly one identifier, normalized to digits-only by the form request,
            // which also guarantees its check digits are valid.
            'cpf' => strlen($data['document']) === 11 ? $data['document'] : null,
            'cnpj' => strlen($data['document']) === 14 ? $data['document'] : null,
            // CNPJ holders never carry a birthday (rule enforced by the FormRequest).
            'birthday' => strlen($data['document']) === 11 ? ($data['birthday'] ?? null) : null,
        ]);

        return [
            'user' => $user,
            'token' => $user->createToken('auth')->plainTextToken,
        ];
    }

    /**
     * Attempt login and issue a Sanctum token.
     *
     * @throws ValidationException
     */
    public function login(string $email, string $password): array
    {
        $user = User::where('email', $email)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Credenciais incorretas.'],
            ]);
        }

        // Revoke previous tokens so a user only has the latest session active.
        $user->tokens()->delete();

        return [
            'user' => $user,
            'token' => $user->createToken('auth')->plainTextToken,
        ];
    }

    /**
     * Update the authenticated user's profile. Fields absent from $data are left
     * untouched. The document swaps cpf↔cnpj atomically (old one is cleared),
     * so uniqueness constraints never trip on the old value.
     */
    public function updateProfile(User $user, array $data): User
    {
        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        if (isset($data['document'])) {
            $data['cpf'] = strlen($data['document']) === 11 ? $data['document'] : null;
            $data['cnpj'] = strlen($data['document']) === 14 ? $data['document'] : null;
            unset($data['document']);

            // Invariante CPF↔aniversário: virar CNPJ apaga o aniversário;
            // virar CPF exige um (garantido pelo FormRequest).
            if ($data['cpf'] === null) {
                $data['birthday'] = null;
            }
        }

        $user->fill($data);
        $user->save();

        return $user;
    }

    /** Revoke the token the request was made with. */
    public function logout(User $user): void
    {
        $user->currentAccessToken()?->delete();
    }

    /** Check whether a user has a given role name. */
    public function hasRole(User $user, string $roleName): bool
    {
        return $user->role?->name === $roleName;
    }
}
