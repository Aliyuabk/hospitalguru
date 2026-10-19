<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('sales', 'prescription_id')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->foreignId('prescription_id')->nullable()->after('patient_id')->constrained()->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('sales', 'prescription_id')) {
            Schema::table('sales', fn (Blueprint $table) => $table->dropConstrainedForeignId('prescription_id'));
        }
    }
};
