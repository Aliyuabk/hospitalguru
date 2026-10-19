<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;use App\Models\Supplier;use Illuminate\Http\Request;
class SupplierController extends Controller {
 public function index(Request $r){$q=Supplier::query();if($s=$r->query('q'))$q->where('name','like',"%$s%");return $q->orderBy('name')->paginate(50);}
 public function store(Request $r){return Supplier::create($r->validate(['name'=>'required|string|max:255','phone'=>'nullable|string|max:32','email'=>'nullable|email|max:255','address'=>'nullable|string|max:500']));}
 public function show(Supplier $supplier){return $supplier->load('stocks.drug');}
 public function update(Request $r,Supplier $supplier){$supplier->update($r->validate(['name'=>'sometimes|required|string|max:255','phone'=>'nullable|string|max:32','email'=>'nullable|email|max:255','address'=>'nullable|string|max:500']));return $supplier;}
 public function destroy(Supplier $supplier){abort_if($supplier->stocks()->exists(),409,'Supplier is linked to stock records.');$supplier->delete();return response()->noContent();}
}
