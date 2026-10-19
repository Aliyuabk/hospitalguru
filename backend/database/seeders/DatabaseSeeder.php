<?php
namespace Database\Seeders;
use App\Models\{Department,Drug,Patient,Stock,Supplier,User};
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
class DatabaseSeeder extends Seeder
{
 public function run():void
 {
  $departments=[];
  foreach([['Central Store','central-store','central_store'],['Central Pharmacy','central-pharmacy','central_pharmacy'],['Department 2','dept-2','dept_2']] as [$name,$code,$type])$departments[$type]=Department::firstOrCreate(['code'=>$code],['name'=>$name,'type'=>$type,'is_active'=>true]);
  $password=env('BKD_SEED_PASSWORD');
  if(!$password||strlen($password)<12)throw new \RuntimeException('Set BKD_SEED_PASSWORD to a unique password of at least 12 characters before seeding.');
  $records=[['HOD Admin','hod@bkd.local','hod',null],['Central Store Keeper','store@bkd.local','store_keeper',$departments['central_store']->id],['Amina Yusuf','amina@bkd.local','pharmacy_staff',$departments['central_pharmacy']->id],['John Okafor','john@bkd.local','pharmacy_staff',$departments['central_pharmacy']->id],['Maryam Bello','maryam@bkd.local','pharmacy_staff',$departments['dept_2']->id],['David James','david@bkd.local','pharmacy_staff',$departments['dept_2']->id],['Medical Director','md@bkd.local','md',null],['BKD Doctor','doctor@bkd.local','doctor',null]];
  foreach($records as [$name,$email,$role,$departmentId])User::firstOrCreate(['email'=>$email],['name'=>$name,'password'=>Hash::make($password),'role'=>$role,'department_id'=>$departmentId,'is_active'=>true]);

  $supplier=Supplier::firstOrCreate(['name'=>'BKD Medical Supplies'],['phone'=>'08000000000','email'=>'supplies@bkd.local','address'=>'Bauchi, Nigeria']);
  $catalog=[
   ['Paracetamol 500mg','MED-0001','890100000001','Pain relief','Tablet',850,490,160],
   ['Amoxicillin 250mg','MED-0002','890100000002','Antibiotic','Capsule',1600,920,90],
   ['Vitamin C 1000mg','MED-0003','890100000003','Supplements','Pack',6000,3500,42],
   ['Artemether/Lumefantrine','MED-0004','890100000004','Antimalarial','Pack',3500,2050,74],
   ['Cetirizine 10mg','MED-0005','890100000005','Allergy','Tablet',1200,690,14],
   ['Omeprazole 20mg','MED-0006','890100000006','Digestive health','Capsule',2200,1280,68],
   ['ORS Sachets','MED-0007','890100000007','Rehydration','Sachet',500,280,130],
   ['Ibuprofen 400mg','MED-0008','890100000008','Pain relief','Tablet',1100,630,83],
  ];
  foreach($catalog as $index=>[$name,$sku,$barcode,$category,$unit,$selling,$cost,$qty]){
   $drug=Drug::firstOrCreate(['sku'=>$sku],['name'=>$name,'barcode'=>$barcode,'category'=>$category,'unit'=>$unit,'is_active'=>true]);
   foreach(['central_store'=>max(80,$qty*2),'central_pharmacy'=>$qty,'dept_2'=>max(10,(int)floor($qty*.55))] as $type=>$quantity){$batch='BKD-2026-'.str_pad((string)($index+1),3,'0',STR_PAD_LEFT).'-'.strtoupper(substr($type,0,2));Stock::firstOrCreate(['drug_id'=>$drug->id,'department_id'=>$departments[$type]->id,'batch_no'=>$batch],['quantity'=>$quantity,'cost_price_naira'=>$cost,'selling_price_naira'=>$selling,'expiry_date'=>now()->addMonths(18)->toDateString(),'supplier_id'=>$supplier->id]);}
  }
  foreach([['Amina Yusuf','BKD/2024/00123','08034567890','NHIS-008194'],['Chinedu Okafor','BKD/2024/00124','08063215501','NHIS-008207'],['Fatima Ibrahim','BKD/2023/00981','07018904412','NHIS-006543']] as [$name,$folder,$phone,$nhis])Patient::firstOrCreate(['folder_no'=>$folder],['full_name'=>$name,'phone'=>$phone,'nhis_number'=>$nhis]);
 }
}
