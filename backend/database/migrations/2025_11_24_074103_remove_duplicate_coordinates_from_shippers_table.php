<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('shippers', function (Blueprint $table) {
            // Remove old duplicate coordinate columns
            $table->dropColumn(['current_latitude', 'current_longitude']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shippers', function (Blueprint $table) {
            // Restore old columns if rollback
            $table->decimal('current_latitude', 10, 8)->nullable()->after('is_available');
            $table->decimal('current_longitude', 11, 8)->nullable()->after('current_latitude');
        });
    }
};
