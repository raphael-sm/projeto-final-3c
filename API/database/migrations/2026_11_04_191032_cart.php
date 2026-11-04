<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('shopping_cart', function(Blueprint $table){
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->uuid('guest_token')->nullable();
            $table->timestamps();
        });

        DB::statement('
            ALTER TABLE shopping_cart 
            ADD CONSTRAINT chk_userid_xor_guesttoken
            CHECK (
                (user_id IS NOT NULL AND guest_token IS NULL) OR 
                (user_id IS NULL AND guest_token IS NOT NULL)
            )
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shopping_cart');
    }
};
