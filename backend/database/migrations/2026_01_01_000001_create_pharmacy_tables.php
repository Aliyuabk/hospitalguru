<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
 public function up():void {
  Schema::create('departments',function(Blueprint $t){$t->id();$t->string('name');$t->string('code')->unique();$t->enum('type',['central_store','central_pharmacy','dept_2']);$t->boolean('is_active')->default(true);$t->timestamps();});
  Schema::create('users',function(Blueprint $t){$t->id();$t->string('name');$t->string('email')->unique();$t->timestamp('email_verified_at')->nullable();$t->string('password');$t->enum('role',['hod','store_keeper','pharmacy_staff','md']);$t->foreignId('department_id')->nullable()->constrained()->nullOnDelete();$t->boolean('is_active')->default(true);$t->rememberToken();$t->timestamps();});
  Schema::create('patients',function(Blueprint $t){$t->id();$t->string('folder_no')->unique();$t->string('full_name')->index();$t->string('phone')->nullable()->index();$t->string('nhis_number')->nullable()->index();$t->timestamps();});
  Schema::create('suppliers',function(Blueprint $t){$t->id();$t->string('name');$t->string('phone')->nullable();$t->string('email')->nullable();$t->string('address')->nullable();$t->timestamps();});
  Schema::create('drugs',function(Blueprint $t){$t->id();$t->string('name')->index();$t->string('barcode')->nullable()->unique();$t->string('sku')->unique();$t->string('category')->nullable();$t->string('unit')->default('Unit');$t->boolean('is_active')->default(true);$t->timestamps();});
  Schema::create('stocks',function(Blueprint $t){$t->id();$t->foreignId('drug_id')->constrained()->cascadeOnDelete();$t->foreignId('department_id')->constrained()->cascadeOnDelete();$t->string('batch_no');$t->unsignedInteger('quantity')->default(0);$t->unsignedBigInteger('cost_price_naira');$t->unsignedBigInteger('selling_price_naira');$t->date('expiry_date');$t->foreignId('supplier_id')->nullable()->constrained()->nullOnDelete();$t->timestamps();$t->index(['drug_id','department_id','expiry_date']);});
  Schema::create('stock_transfers',function(Blueprint $t){$t->id();$t->string('transfer_no')->unique();$t->foreignId('from_department_id')->constrained('departments');$t->foreignId('to_department_id')->constrained('departments');$t->foreignId('drug_id')->constrained()->cascadeOnDelete();$t->foreignId('from_stock_id')->nullable()->constrained('stocks')->nullOnDelete();$t->string('batch_no');$t->unsignedInteger('quantity');$t->foreignId('created_by')->constrained('users');$t->string('status')->default('completed');$t->timestamp('transferred_at');$t->timestamps();});
  Schema::create('sales',function(Blueprint $t){$t->id();$t->string('invoice_no')->unique();$t->uuid('client_sale_id')->unique();$t->foreignId('patient_id')->nullable()->constrained()->nullOnDelete();$t->foreignId('staff_id')->constrained('users');$t->foreignId('department_id')->constrained();$t->unsignedBigInteger('subtotal_naira');$t->unsignedBigInteger('discount_naira')->default(0);$t->unsignedBigInteger('total_naira');$t->enum('payment_mode',['Cash','Transfer','NHIS','Staff Credit']);$t->boolean('is_synced')->default(true);$t->timestamp('sold_at');$t->timestamps();$t->index(['department_id','sold_at']);});
  Schema::create('sale_items',function(Blueprint $t){$t->id();$t->foreignId('sale_id')->constrained()->cascadeOnDelete();$t->foreignId('drug_id')->constrained();$t->unsignedInteger('quantity');$t->unsignedBigInteger('unit_price_naira');$t->unsignedBigInteger('cost_price_naira');$t->unsignedBigInteger('line_total_naira');$t->timestamps();});
  Schema::create('audit_logs',function(Blueprint $t){$t->id();$t->foreignId('user_id')->nullable()->constrained()->nullOnDelete();$t->string('action');$t->string('auditable_type')->nullable();$t->unsignedBigInteger('auditable_id')->nullable();$t->json('metadata')->nullable();$t->ipAddress('ip_address')->nullable();$t->timestamps();});
 }
 public function down():void { foreach(['audit_logs','sale_items','sales','stock_transfers','stocks','drugs','suppliers','patients','users','departments'] as $table)Schema::dropIfExists($table); }
};
