<?php

namespace App\Http\Requests;

use App\Support\TaxId;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Birthday is required only when the document is a CPF (natural person).
     * CNPJ holders (companies) do not have one and must not send it.
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', Password::min(8)],
            // Exactly one document is provided and it must carry valid check digits.
            'document' => [
                'required',
                'string',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    $digits = preg_replace('/\D/', '', (string) $value) ?? '';

                    if (!in_array(strlen($digits), [11, 14], true)) {
                        $fail('O documento deve ser um CPF (11 dígitos) ou CNPJ (14 dígitos).');

                        return;
                    }

                    if (!TaxId::isValid($digits)) {
                        $fail('O documento informado é inválido.');
                    }
                },
            ],
            // Birthday requirement is decided statically from the payload
            // document (see birthdayRuleSet) so it fires even when absent.
            'birthday' => $this->birthdayRuleSet(),
        ];
    }

    /** Unify the alias (birth_date) into `birthday` BEFORE validation runs. */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'birthday' => $this->input('birthday') ?? $this->input('birth_date'),
        ]);
    }

    /**
     * Birthday rules decided statically from the payload document so they fire
     * even when the field is absent (Laravel skips non-required rules on absent
     * attributes): CPF → required + adult-only; CNPJ → prohibited.
     */
    protected function birthdayRuleSet(): array
    {
        $digits = preg_replace('/\D/', '', (string) $this->input('document')) ?? '';

        return strlen($digits) === 11
            ? ['required', 'date', 'before:-18 years']
            : ['prohibited'];
    }

    /** Reduce the document to digits only after validation passes. */
    protected function passedValidation(): void
    {
        $this->merge([
            'document' => preg_replace('/\D/', '', $this->input('document')) ?? '',
        ]);
    }
}
