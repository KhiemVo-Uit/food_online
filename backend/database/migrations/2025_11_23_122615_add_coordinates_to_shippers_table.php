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
            // Add latitude and longitude as aliases/copies of current_latitude/current_longitude
            $table->decimal('latitude', 10, 8)->nullable()->after('current_longitude');
            $table->decimal('longitude', 11, 8)->nullable()->after('latitude');
        });
        
        // Copy existing data from current_latitude/current_longitude to latitude/longitude
        DB::statement('UPDATE shippers SET latitude = current_latitude, longitude = current_longitude');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shippers', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude']);
        });
    }
};
