<?php

namespace App\Services;

use App\Models\Address;
use Illuminate\Database\Eloquent\Collection;

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
