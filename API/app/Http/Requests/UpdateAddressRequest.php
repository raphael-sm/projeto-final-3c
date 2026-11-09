<?php

namespace App\Http\Requests;

class UpdateAddressRequest extends StoreAddressRequest
{
    public function rules(): array
    {
        return [
            'user_id' => ['sometimes', 'required', 'integer', 'exists:users,id'],
            'address' => ['sometimes', 'required', 'string'],
        ];
    }
}
