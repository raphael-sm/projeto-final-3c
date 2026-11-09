<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration {
    public function up(): void
    {
        // Slug legível nas URLs: /categoria/{slug}. Criado nullable para
        // poder preencher as linhas existentes antes de aplicar o NOT NULL.
        Schema::table('categories', function (Blueprint $table) {
            $table->string('slug')->nullable()->after('name');
        });

        // Preenche o slug das categorias já existentes a partir do nome.
        DB::table('categories')->orderBy('id')->get()->each(function ($category) {
            DB::table('categories')
                ->where('id', $category->id)
                ->update(['slug' => Str::slug($category->name)]);
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->string('slug')->nullable(false)->change();
            $table->unique('slug');
        });

        // Fabricante usado pelos filtros da loja.
        Schema::table('products', function (Blueprint $table) {
            $table->string('manufacturer')->nullable()->after('specs');
            $table->index('manufacturer');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['manufacturer']);
            $table->dropColumn('manufacturer');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->dropColumn('slug');
        });
    }
};
