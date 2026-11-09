<?php

namespace App\Http\Requests;

class UpdateCategoryRequest extends StoreCategoryRequest
{
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
        ];
    }
}
