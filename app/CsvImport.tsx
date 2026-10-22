'use client';

import { useRef,useState } from 'react';
import { downloadCsv,parseCsv } from '@/lib/csv';

export default function CsvImport({resource,onComplete,onMessage}:{resource:'drugs'|'suppliers';onComplete:()=>void;onMessage:(message:string)=>void}){
  const input=useRef<HTMLInputElement>(null);const [busy,setBusy]=useState(false);
  async function importFile(file?:File){
    if(!file)return;setBusy(true);
    try{
      const rows=parseCsv(await file.text());if(!rows.length)throw new Error('The selected CSV has no data rows.');
      const response=await fetch('/api/admin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({resource,import_rows:rows})});
      const result=await response.json();if(!response.ok)throw new Error(result.error||'Import failed.');
      onMessage(`${result.imported} ${resource==='drugs'?'medicine':'supplier'} records imported.`);onComplete();
    }catch(error){onMessage(error instanceof Error?error.message:'Could not import this CSV.');}
    finally{setBusy(false);if(input.current)input.current.value='';}
  }
  const headers=resource==='drugs'?['sku','generic_name','brand_name','barcode','category','strength','dosage_form','base_unit']:['code','name','contact_person','phone','email','address','registration_no'];
  return <><button type="button" className="button button-quiet" onClick={()=>downloadCsv(`${resource}-template.csv`,[],headers)}>CSV template</button><label className="button button-secondary csv-import-button">{busy?'Importing…':'⇧ Import CSV'}<input ref={input} type="file" accept=".csv,text/csv" hidden disabled={busy} onChange={event=>importFile(event.target.files?.[0])}/></label></>;
}
