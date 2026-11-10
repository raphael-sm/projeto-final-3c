<?php

namespace App\Http\Resources;

use App\Support\TaxId;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /** Whether the owner's raw document should be embedded (owner endpoints only). */
    private bool $withRaw = false;

    public function toArray(Request $request): array
    {
        $data = [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            // Masked by default (LGPD minimization)...
            'document' => $this->maskedDocument(),
            'document_type' => $this->cnpj !== null ? 'cnpj' : ($this->cpf !== null ? 'cpf' : null),
            'birthday' => $this->birthday,
            'role' => $this->role?->name,
            'created_at' => $this->created_at,
        ];

        // Owner's profile endpoints (GET/PATCH /auth/me) also carry the raw
        // document: LGPD art. 18 grants the holder access to their own data;
        // every other consumer keeps seeing only the masked value.
        if ($this->withRaw) {
            $data['cpf'] = $this->cpf;
            $data['cnpj'] = $this->cnpj;
        }

        return $data;
    }

    public function withRawDocument(): self
    {
        $this->withRaw = true;

        return $this;
    }

    private function maskedDocument(): ?string
    {
        return match (true) {
            $this->cpf !== null => TaxId::mask($this->cpf),
            $this->cnpj !== null => TaxId::mask($this->cnpj),
            default => null,
        };
    }
}
