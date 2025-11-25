<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->onDelete('cascade');
            $table->enum('payment_method', ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'E_WALLET']);
            $table->decimal('amount', 10, 2);
            $table->enum('status', ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'])->default('PENDING');
            $table->string('transaction_id')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
