<?php

namespace App\Http\Requests;

class UpdateAddressRequest extends StoreAddressRequest
{
    public function rules(): array
    {
        // user_id is ignored: an address can never be reassigned to another user (LGPD).
        return [
            'address' => ['sometimes', 'required', 'string', 'max:500'],
        ];
    }
}
