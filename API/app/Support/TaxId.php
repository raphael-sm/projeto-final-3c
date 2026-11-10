<?php

namespace App\Support;

use InvalidArgumentException;

/**
 * CPF/CNPJ handling: validation, formatting and generation of
 * mathematically valid but fictitious identifiers (privacy —
 * generated values never belong to a real person/document holder).
 */
final class TaxId
{
    private const CPF_LENGTH = 11;

    private const CNPJ_LENGTH = 14;

    /**
     * Accepts digits-only, "000.000.000-00", "00.000.000/0000-00",
     * "00000000000" and "00000000000000" forms.
     *
     * @throws InvalidArgumentException when invalid
     */
    public static function validate(string $value): string
    {
        $digits = preg_replace('/\D/', '', $value) ?? '';

        return match (strlen($digits)) {
            self::CPF_LENGTH => self::validateCheckDigits($digits),
            self::CNPJ_LENGTH => self::validateCheckDigits($digits),
            default => throw new InvalidArgumentException('Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos.'),
        };
    }

    /** Generate a mathematically valid, fictitious CPF (11 digits). */
    public static function generateValidCpf(): string
    {
        // 9 random digits, never an all-same-digit CPF (those fail the check digits anyway).
        do {
            $base = '';
            for ($i = 0; $i < 9; $i++) {
                $base .= random_int(0, 9);
            }
        } while (preg_match('/^(\d)\1{8}$/', $base) === 1);

        return $base . self::cpfCheckDigits($base);
    }

    /** Generate a mathematically valid, fictitious CNPJ (14 digits). */
    public static function generateValidCnpj(): string
    {
        // 00000001 + fixed check digits is a reserved/example CNPJ; use 8 random digits
        // for the base (avoiding the reserved 00000000 root used by governments).
        do {
            $base = '';
            for ($i = 0; $i < 8; $i++) {
                $base .= random_int(0, 9);
            }
        } while ($base === '00000000');

        return $base . '0001' . self::cnpjCheckDigits($base . '0001');
    }

    public static function mask(string $digits): string
    {
        $d = preg_replace('/\D/', '', $digits) ?? '';

        return match (strlen($d)) {
            self::CPF_LENGTH => sprintf('%s.%s.%s-%s', substr($d, 0, 3), substr($d, 3, 3), substr($d, 6, 3), substr($d, 9, 2)),
            self::CNPJ_LENGTH => sprintf('%s.%s.%s/%s-%s', substr($d, 0, 2), substr($d, 2, 3), substr($d, 5, 3), substr($d, 8, 4), substr($d, 12, 2)),
            default => throw new InvalidArgumentException('Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos.'),
        };
    }

    /** Alias kept for readability at call sites. */
    public static function isValid(string $value): bool
    {
        try {
            self::validate($value);

            return true;
        } catch (InvalidArgumentException) {
            return false;
        }
    }

    private static function cpfCheckDigits(string $nineDigits): string
    {
        $d1 = self::mod11Weighted($nineDigits, range(10, 2));

        // Standard behaviour: if remainder < 2 the digit is 0.
        $d2 = self::mod11Weighted($nineDigits . $d1, range(11, 2));

        return $d1 . $d2;
    }

    private static function cnpjCheckDigits(string $twelveDigits): string
    {
        $d1 = self::mod11Weighted($twelveDigits, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
        $d2 = self::mod11Weighted($twelveDigits . $d1, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

        return $d1 . $d2;
    }

    private static function mod11Weighted(string $digits, array $weights): string
    {
        $sum = 0;

        foreach ($weights as $i => $weight) {
            $sum += (int) $digits[$i] * $weight;
        }

        $remainder = $sum % 11;

        return (string) (($remainder < 2) ? 0 : 11 - $remainder);
    }

    private static function validateCheckDigits(string $digits): string
    {
        if (preg_match('/^(\d)\1{10}$/', $digits) === 1) {
            throw new InvalidArgumentException('CPF/CNPJ inválido.');
        }

        if (strlen($digits) === self::CPF_LENGTH) {
            $expected = self::cpfCheckDigits(substr($digits, 0, 9));
        } else {
            $expected = self::cnpjCheckDigits(substr($digits, 0, 12));
        }

        if (substr($digits, -2) !== $expected) {
            throw new InvalidArgumentException('CPF/CNPJ inválido (dígitos verificadores).');
        }

        return $digits;
    }
}
