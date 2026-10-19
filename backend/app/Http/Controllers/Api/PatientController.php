<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;use App\Models\Patient;use Illuminate\Http\Request;
class PatientController extends Controller {
 public function index(Request $r){$q=Patient::query();if($s=$r->query('q'))$q->where(fn($w)=>$w->where('folder_no','like',"%$s%")->orWhere('full_name','like',"%$s%")->orWhere('phone','like',"%$s%")->orWhere('nhis_number','like',"%$s%"));return $q->orderBy('full_name')->paginate(25);}
 public function store(Request $r){return Patient::create($r->validate(['folder_no'=>'required|string|max:64|unique:patients','full_name'=>'required|string|max:255','phone'=>'nullable|string|max:32','nhis_number'=>'nullable|string|max:64']));}
 public function show(Patient $patient){return $patient;}
 public function update(Request $r,Patient $patient){$patient->update($r->validate(['folder_no'=>'sometimes|required|string|max:64|unique:patients,folder_no,'.$patient->id,'full_name'=>'sometimes|required|string|max:255','phone'=>'nullable|string|max:32','nhis_number'=>'nullable|string|max:64']));return $patient;}
 public function destroy(Patient $patient){$patient->delete();return response()->noContent();}
}
