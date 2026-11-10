<?php

namespace App\Services;

use App\Models\Address;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use RuntimeException;

class AddressService
{
    /** Maximum number of addresses a user may register. */
    public const MAX_ADDRESSES_PER_USER = 4;

    /**
     * Addresses of the authenticated user only (LGPD data minimization):
     * admins get no special access to other people's addresses.
     */
    public function visibleTo(User $user): Collection
    {
        return Address::where('user_id', $user->id)->get();
    }

    /** Find an address owned by the given user or fail. */
    public function findOwnedBy(int|string $id, User $user): Address
    {
        $address = Address::where('user_id', $user->id)->findOrFail($id);

        return $address;
    }

    /** @throws RuntimeException when the address belongs to someone else */
    public function assertOwnedBy(Address $address, User $user): void
    {
        if ($address->user_id !== $user->id) {
            throw new RuntimeException('Este endereço não pertence a você.');
        }
    }

    /**
     * @throws RuntimeException when the user already has the maximum number of addresses
     */
    public function create(User $user, array $data): Address
    {
        $count = Address::where('user_id', $user->id)->count();

        if ($count >= self::MAX_ADDRESSES_PER_USER) {
            throw new RuntimeException(
                'Você atingiu o limite de ' . self::MAX_ADDRESSES_PER_USER . ' endereços.'
            );
        }

        return Address::create([
            ...$data,
            'user_id' => $user->id,
        ]);
    }

    public function update(Address $address, array $data): Address
    {
        // Ownership was already established; never let the payload reassign it.
        unset($data['user_id']);

        $address->update($data);

        return $address;
    }

    public function delete(Address $address): void
    {
        $address->delete();
    }
}
