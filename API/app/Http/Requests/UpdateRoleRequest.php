<?php

namespace App\Http\Requests;

class UpdateRoleRequest extends StoreRoleRequest
{
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
        ];
    }
}
