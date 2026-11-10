<?php

namespace App\Http\Requests;

use App\Support\TaxId;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/**
 * PATCH /api/auth/me — profile update. Every field is optional; the user's
 * tax document can be replaced but never removed (an account always carries
 * exactly one of cpf/cnpj after registration).
 */
class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($this->user()?->id)],
            'password' => ['sometimes', 'required', Password::min(8)],
            'document' => [
                'sometimes',
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
            // Birthday: quando ENVIADO, precisa ser coerente com o documento
            // efetivo (payload ou o já na conta) — obrigatório e adulto para
            // CPF, proibido para CNPJ. Ausente = não altera (PATCH parcial).
            'birthday' => ['nullable', 'date', $this->birthdayRule()],
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
     * Birthday rule based on the effective document: the one in the payload,
     * falling back to the account's current one when the request doesn't
     * change it. Executa somente quando o campo vem no payload — que é o
     * comportamento desejado num PATCH parcial.
     */
    protected function birthdayRule(): \Closure
    {
        return function (string $attribute, mixed $value, \Closure $fail): void {
            $digits = $this->has('document')
                ? preg_replace('/\D/', '', (string) $this->input('document')) ?? ''
                : (string) ($this->user()?->cpf ?? $this->user()?->cnpj);

            if (strlen($digits) !== 11) {
                $fail('Pessoa jurídica (CNPJ) não informa data de nascimento.');

                return;
            }

            if (! strtotime((string) $value)) {
                $fail('Data de nascimento inválida.');

                return;
            }

            if (strtotime((string) $value) > strtotime('-18 years')) {
                $fail('É necessário ser maior de 18 anos.');
            }
        };
    }

    /** Reduce the document to digits only after validation passes. */
    protected function passedValidation(): void
    {
        if ($this->has('document')) {
            $this->merge([
                'document' => preg_replace('/\D/', '', $this->input('document')) ?? '',
            ]);
        }
    }
}
