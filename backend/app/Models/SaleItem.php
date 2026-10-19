<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class SaleItem extends Model { protected $fillable=['sale_id','drug_id','quantity','unit_price_naira','cost_price_naira','line_total_naira']; }
