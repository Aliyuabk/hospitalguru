export function downloadCsv(filename:string,rows:Record<string,unknown>[],headers?:string[]){
  if(!rows.length&&!headers?.length)return false;
  const columns=headers?.length?headers:Object.keys(rows[0]);
  const quote=(value:unknown)=>{
    let text=value===null||value===undefined?'':value instanceof Date?value.toISOString():String(value);
    if(/^[=+@\-\t\r]/.test(text))text=`'${text}`;
    return `"${text.replaceAll('"','""')}"`;
  };
  const lines=[columns.map(quote).join(','),...rows.map(row=>columns.map(column=>quote(row[column])).join(','))];
  const blob=new Blob(['\uFEFF'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=filename;link.click();URL.revokeObjectURL(url);return true;
}

export function parseCsv(text:string){
  const rows:string[][]=[];let row:string[]=[];let cell='';let quoted=false;
  for(let i=0;i<text.length;i++){
    const char=text[i];
    if(quoted){if(char==='"'&&text[i+1]==='"'){cell+='"';i++}else if(char==='"')quoted=false;else cell+=char;continue}
    if(char==='"'){quoted=true;continue}
    if(char===','){row.push(cell.trim());cell='';continue}
    if(char==='\n'||char==='\r'){if(char==='\r'&&text[i+1]==='\n')i++;row.push(cell.trim());if(row.some(value=>value!==''))rows.push(row);row=[];cell='';continue}
    cell+=char;
  }
  if(cell!==''||row.length){row.push(cell.trim());if(row.some(value=>value!==''))rows.push(row)}
  if(!rows.length)return [];
  const headers=rows.shift()!.map((header,index)=>index===0?header.replace(/^\uFEFF/,''):header).map(header=>header.trim().toLowerCase().replace(/[\s/-]+/g,'_'));
  return rows.map(values=>Object.fromEntries(headers.map((header,index)=>[header,values[index]||''])));
}
