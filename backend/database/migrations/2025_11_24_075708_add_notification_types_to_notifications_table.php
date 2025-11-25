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
        DB::statement("ALTER TABLE notifications MODIFY COLUMN type ENUM('NEW_ORDER', 'ORDER_CONFIRMED', 'ORDER_CANCELLED', 'ORDER_DELIVERED', 'ORDER_COOKING', 'ORDER_PICKING_UP', 'ORDER_DELIVERING') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE notifications MODIFY COLUMN type ENUM('NEW_ORDER', 'ORDER_CONFIRMED', 'ORDER_CANCELLED', 'ORDER_DELIVERED') NOT NULL");
    }
};
