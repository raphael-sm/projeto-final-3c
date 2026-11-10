<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAddressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // user_id is always taken from the authenticated user (LGPD) and never from the payload.
        return [
            'address' => ['required', 'string', 'max:500'],
        ];
    }
}
