<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PharmacySetting extends Model
{
    protected $fillable = ['key', 'value', 'updated_by'];

    public static function valueFor(string $key, int $default): int
    {
        $value = static::where('key', $key)->value('value');
        return $value === null ? $default : max(0, (int) $value);
    }
}
