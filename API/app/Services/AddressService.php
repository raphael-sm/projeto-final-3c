<?php

namespace App\Services;

use App\Models\Address;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use RuntimeException;

class AddressService
{
    public function all(): Collection
    {
        return Address::all();
    }

    public function find(int|string $id): Address
    {
        return Address::findOrFail($id);
    }

    /** Addresses of the authenticated user (admins see all). */
    public function visibleTo(User $user): Collection
    {
        if ($user->role?->name === 'admin') {
            return $this->all();
        }

        return Address::where('user_id', $user->id)->get();
    }

    /** @throws RuntimeException when the address belongs to someone else */
    public function assertOwnedBy(Address $address, User $user): void
    {
        if ($address->user_id !== $user->id) {
            throw new RuntimeException('Este endereço não pertence a você.');
        }
    }

    public function create(array $data): Address
    {
        return Address::create($data);
    }

    public function update(Address $address, array $data): Address
    {
        $address->update($data);

        return $address;
    }

    public function delete(Address $address): void
    {
        $address->delete();
    }
}
