<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('shopping_carts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->unique()->constrained()->cascadeOnDelete();
            $table->uuid('guest_token')->nullable()->unique();
            $table->timestamps();
        });

        // SQLite cannot ADD CONSTRAINT via ALTER TABLE; enforce the XOR at app level there.
        if (DB::connection()->getDriverName() !== 'sqlite') {
            DB::statement('
                ALTER TABLE shopping_carts
                ADD CONSTRAINT chk_userid_xor_guesttoken
                CHECK (
                    (user_id IS NOT NULL AND guest_token IS NULL) OR
                    (user_id IS NULL AND guest_token IS NOT NULL)
                )
            ');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shopping_carts');
    }
};
