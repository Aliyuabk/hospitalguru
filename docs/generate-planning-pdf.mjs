import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Small dependency-free vector PDF generator for the companion planning pack.
const W = 595, H = 842;
const C = { green:'#116B52', dark:'#17352F', mint:'#EAF5F1', ink:'#24332F', muted:'#63736D', line:'#D9E4DF', gold:'#D29B2E', pale:'#F6F9F7', red:'#B84A42', blue:'#477DA8', white:'#FFFFFF' };
const hex = h => h.slice(1).match(/../g).map(x => parseInt(x,16)/255).map(x => Number(x.toFixed(3))).join(' ');
function page(title, sub='GENERAL HOSPITAL BKD  /  PHARMACY SYSTEM PLANNING') {
  const a=[];
  a.push('1 0 0 -1 0 842 cm');
  a.push(`0.96 0.98 0.97 rg 0 0 ${W} ${H} re f`);
  a.push(`0.067 0.42 0.32 rg 0 0 ${W} 8 re f`);
  text(a,sub.toUpperCase(),42,34,8,'B',C.green);
  text(a,title,42,69,25,'B',C.dark);
  a.push(`${hex(C.line)} RG 42 86 m 553 86 l S`);
  return a;
}
function text(a,s,x,y,size=10,font='R',color=C.ink){
  const safe=String(s).normalize('NFKD').replace(/[^\x20-\x7E]/g,'').replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
  a.push(`${hex(color)} rg BT /F${font==='B'?2:1} ${size} Tf 1 0 0 -1 ${x} ${y} Tm (${safe}) Tj ET`);
}
function rect(a,x,y,w,h,fill=C.white,stroke=C.line,r=10){
  a.push(`${hex(fill)} rg ${hex(stroke)} RG 1 w ${x} ${y} ${w} ${h} re B`);
}
function rule(a,x1,y1,x2,y2,color=C.line,width=1){a.push(`${hex(color)} RG ${width} w ${x1} ${y1} m ${x2} ${y2} l S`)}
function lines(a,arr,x,y,size=10,leading=15,color=C.ink,font='R') { arr.forEach((s,i)=>text(a,s,x,y+i*leading,size,font,color)); }
function label(a,s,x,y,color=C.green){text(a,s.toUpperCase(),x,y,8,'B',color)}
function box(a,x,y,w,h,title,items,opts={}){
  rect(a,x,y,w,h,opts.fill||C.white,opts.stroke||C.line);
  text(a,title,x+14,y+23,12,'B',opts.titleColor||C.dark);
  if(Array.isArray(items)) lines(a,items,x+14,y+45,opts.size||9,opts.leading||14,opts.color||C.ink);
}
function footer(a,n){rule(a,42,805,553,805);text(a,'BKD PHARMACY  /  PLANNING CONCEPT  /  FOR REVIEW',42,824,7,'R',C.muted);text(a,String(n).padStart(2,'0'),535,824,8,'B',C.green)}
function pill(a,s,x,y,w,color=C.mint){rect(a,x,y,w,22,color,color,11);text(a,s,x+10,y+15,8,'B',C.green)}
function uiFrame(a,x,y,w,h,title,active='Dashboard'){
  rect(a,x,y,w,h,C.white,C.line,9);a.push(`${hex(C.green)} rg ${x} ${y} 104 ${h} re f`);
  text(a,'BKD  PHARMACY',x+12,y+24,9,'B',C.white);
  ['Dashboard','Inventory','Point of Sale','Stock Counts','Patients','Reports','Staff Chat'].forEach((v,i)=>{
    if(v===active){rect(a,x+7,y+42+i*27,90,22,'#2A8068','#2A8068',5);}
    text(a,v,x+16,y+57+i*27,7,'R',C.white);
  });
  text(a,title,x+119,y+24,13,'B',C.dark);
  rect(a,x+119,y+36,w-135,25,C.pale,C.line,5);text(a,'Search  /  Notifications  /  Profile',x+129,y+52,7,'R',C.muted);
}
const pages=[];
{
 const a=[];a.push('1 0 0 -1 0 842 cm');a.push(`${hex(C.mint)} rg 0 0 ${W} ${H} re f`);a.push(`${hex(C.green)} rg 0 0 ${W} 12 re f`);
 rect(a,40,52,118,28,C.white,C.white,14);text(a,'PLANNING DOCUMENT',54,70,9,'B',C.green);
 text(a,'GENERAL HOSPITAL BKD',42,170,14,'B',C.green);
 lines(a,['PHARMACY SYSTEM','Architecture &','Page Design Plan'],42,235,34,46,C.dark,'B');
 lines(a,['A practical blueprint for the first release, pharmacy workflows,','local and cloud operation, and the user interface concept.'],44,405,13,21,C.muted);
 rect(a,42,501,511,178,C.white,C.line,16);
 text(a,'PLANNING SCOPE',62,535,10,'B',C.green);
 lines(a,['Drug catalogue, stock and inter-unit transfers','POS sales and payment recording','Patient prescriptions and dispensing','Physical stock counts and reconciliation','Offline operation, staff accounts and text chat'],62,566,12,23,C.ink);
 text(a,'Prepared for General Hospital BKD  |  Kowaguru Technology Limited',42,751,10,'B',C.dark);
 text(a,'18 October 2026  |  Version 1.0  |  Requirements and designs for review',42,773,9,'R',C.muted);footer(a,1);pages.push(a);
}
{
 const a=page('Confirmed scope & module map');
 box(a,42,105,247,170,'CLIENT CONFIRMATIONS',['Initial feature scope accepted','Allow more pharmacy units and staff','Hospital server, with cloud support','MD remote access through VPN','Fixed medicine prices','NHIS can follow in a later release','Existing stock and price records exist','Hardware selection: recommend suitable devices'],{size:9,leading:15});
 box(a,303,105,250,170,'FIRST RELEASE MODULES',['Catalogue and fixed-price setup','Receiving, balances and transfers','POS, receipts and payment methods','Patient records and prescriptions','Physical stock count and adjustment','Low-stock and near-expiry alerts','Staff accounts, roles and reports','Offline sales queue and synchronization','Text-only staff-to-staff chat'],{size:9,leading:15});
 label(a,'Later phase',42,312,C.gold);
 box(a,42,327,511,113,'DEFERRED / OPTIONAL MODULES',['NHIS claims; controlled-drug registers; broader hospital integrations','Advanced management reports; formal receiving approvals; POS terminal integration','Physical count is important to the client and is included in the first release plan.'],{size:10,leading:18,fill:'#FFFCF4',stroke:'#EADCB7'});
 label(a,'Hardware starting recommendation',42,478);
 box(a,42,493,511,187,'PERIPHERALS TO CONFIRM WITH THE HOSPITAL',['USB 1D/2D barcode scanner for medicine packs and product codes','Thermal receipt printer (for example, Epson TM-T20 series or equivalent)','Direct thermal label printer for patient medicine labels','UPS for the local server, network equipment and pharmacy workstations','Confirm Windows, paper width, drivers, barcode format and service availability before purchasing'],{size:10,leading:20});footer(a,2);pages.push(a);
}
{
 const a=page('Users, permissions & daily workflows');
 const cols=[['Pharmacy staff',['Search and scan items','Create POS sales / record tender','View available stock','Dispense against prescription','Receive stock-count assignments']],['Storekeeper',['Receive and transfer stock','Maintain central store balance','Prepare count sessions','Review discrepancy reasons']],['HOD / pharmacy lead',['Manage catalogue and fixed prices','Approve stock adjustments','Manage pharmacy units and staff','Review sales, expiry and count reports']],['MD / management',['View authorized reports remotely','Connect through hospital VPN','Review backup and service status']]];
 cols.forEach((c,i)=>box(a,42+(i%2)*261,108+Math.floor(i/2)*170,250,151,c[0],c[1],{size:9,leading:16}));
 label(a,'Core transaction path',42,476);
 const steps=[['1','Receive'],['2','Store / transfer'],['3','Sell / dispense'],['4','Count'],['5','Reconcile']];
 steps.forEach((s,i)=>{let x=45+i*103;rect(a,x,500,88,76,i===4?'#FFFCF4':C.white,i===4?'#EADCB7':C.line,9);text(a,s[0],x+12,526,15,'B',C.green);text(a,s[1],x+12,552,9,'B',C.dark);if(i<4){rule(a,x+89,538,x+100,538,C.green,2)}});
 box(a,42,606,511,90,'CONTROL RULES',['Use named accounts and role-based permissions; log stock movements, adjustments and returns.','A stock adjustment records system quantity, counted quantity, variance, reason and approver.','Keep local sales available during network interruptions; sync safely when connectivity returns.'],{size:9,leading:16,fill:C.mint,stroke:C.mint});footer(a,3);pages.push(a);
}
{
 const a=page('System architecture & deployment');
 // LAN boundary and service tiers
 rect(a,42,113,336,412,'#F2F8F5','#BFD8CE',14);label(a,'Hospital network / LAN',58,139);
 box(a,62,158,135,79,'Pharmacy workstations',['Browser or desktop client','Scanners / receipt / label printer'],{size:8,leading:13,fill:C.white});
 box(a,222,158,137,79,'Other pharmacy units',['Staff accounts','Future departments'],{size:8,leading:13,fill:C.white});
 box(a,100,277,214,91,'Local application server',['Frontend + API','LAN access; local IP discovery','One authoritative writer'],{size:9,leading:15,fill:'#EAF5F1',stroke:'#9BC9B6'});
 box(a,100,407,214,81,'Hospital database',['MySQL / MariaDB','Transactions, permissions, audit trail'],{size:9,leading:15,fill:C.white});
 rule(a,130,238,174,276,C.green,2);rule(a,286,238,240,276,C.green,2);rule(a,207,368,207,405,C.green,2);
 rect(a,396,113,157,412,C.white,C.line,14);label(a,'Remote & resilience',412,139);
 box(a,411,158,127,96,'MD remote access',['Hospital VPN','Authorized account','No public database port'],{size:8,leading:14,fill:C.pale});
 box(a,411,280,127,98,'Encrypted cloud recovery',['Backup copy / recovery site','VPN or secure tunnel','Restore procedure needed'],{size:8,leading:14,fill:C.pale});
 box(a,411,407,127,81,'Offline workflow',['Local queue','Unique transaction IDs','Retry / duplicate checks'],{size:8,leading:14,fill:C.pale});
 rule(a,378,198,410,198,C.blue,2);rule(a,378,331,410,331,C.blue,2);rule(a,378,448,410,448,C.gold,2);
 label(a,'Key deployment recommendation',42,565);
 box(a,42,580,511,121,'KEEP THE HOSPITAL LAN FAST AND THE DATA CONSISTENT',['Local server and local database serve pharmacy users during normal operation.','Use encrypted, scheduled backups to cloud storage or an approved recovery server.','Avoid multi-master writes until conflict handling and recovery are deliberately designed.','Define backup schedule, retention, recovery time and recovery point with hospital management.'],{size:9,leading:17});footer(a,4);pages.push(a);
}
{
 const a=page('Page design  |  dashboard & inventory');
 uiFrame(a,42,110,511,340,'Pharmacy overview','Dashboard');
 const kpis=[['Today sales','₦ 245,600'],['Items low','08'],['Near expiry','12'],['Pending counts','02']];
 kpis.forEach((k,i)=>{const x=170+(i%2)*178,y=157+Math.floor(i/2)*67;rect(a,x,y,164,54,i===1?'#FFFCF4':C.white,C.line,6);text(a,k[0],x+10,y+19,8,'R',C.muted);text(a,k[1],x+10,y+41,14,'B',C.dark)});
 rect(a,170,300,340,116,C.pale,C.line,6);text(a,'Sales trend  /  stock alerts  /  recent activity',181,322,8,'B',C.muted);rule(a,190,385,480,385,C.line);[0,1,2,3,4,5,6].forEach((v,i)=>rule(a,200+i*40,374-(v%3)*13,200+i*40,385,C.green,5));
 label(a,'Inventory workspace',42,490);
 uiFrame(a,42,510,511,220,'Stock balances','Inventory');
 ['Medicine','Unit','On hand','Reorder','Expiry'].forEach((h,i)=>text(a,h,170+i*68,590,7,'B',C.muted));
 ['Paracetamol 500mg','Central','420','100','2027-04','Amoxicillin 250mg','OPD','36','60','2026-12','ORS sachet','Main','18','50','2027-01'].reduce((acc,v,i)=>{acc.push(v);if(acc.length===5){let row=acc.splice(0);let y=614+Math.floor(i/5)*30;row.forEach((c,j)=>text(a,c,170+j*68,y,7,'R',j===3&&c==='60'?C.red:C.ink));rule(a,169,y+8,526,y+8,C.line,.5)}return acc},[]);
 footer(a,5);pages.push(a);
}
{
 const a=page('Page design  |  POS & physical stock count');
 label(a,'Point of sale',42,110);
 uiFrame(a,42,128,511,247,'New sale','Point of Sale');
 rect(a,170,174,208,34,C.white,C.line,5);text(a,'Scan barcode or search medicine',181,195,8,'R',C.muted);
 ['Item','Qty','Price','Total'].forEach((v,i)=>text(a,v,174+i*67,234,7,'B',C.muted));
 ['Paracetamol 500mg','2','₦ 250','₦ 500','Vitamin C 100mg','1','₦ 1,200','₦ 1,200'].forEach((v,i)=>{let row=Math.floor(i/4),col=i%4;text(a,v,174+col*67,258+row*27,7,'R',C.ink)});
 rect(a,390,224,133,120,C.mint,C.mint,7);text(a,'TOTAL  ₦ 1,700',402,249,10,'B',C.dark);text(a,'Cash / POS / transfer',402,275,8,'R',C.ink);text(a,'Patient / prescription',402,296,8,'R',C.ink);pill(a,'Complete sale',402,310,98,C.white);
 label(a,'Physical stock count',42,421);
 uiFrame(a,42,440,511,247,'Count session  /  OPD pharmacy','Stock Counts');
 pill(a,'Session: October cycle',170,488,142);pill(a,'Status: in progress',321,488,125,'#FFFCF4');
 ['Medicine','System','Counted','Variance','Reason'].forEach((v,i)=>text(a,v,170+i*67,534,7,'B',C.muted));
 ['Amoxicillin','36','31','-5','Breakage?','ORS sachet','18','20','+2','Counted'].forEach((v,i)=>{let row=Math.floor(i/5),col=i%5;text(a,v,170+col*67,559+row*29,7,'R',C.ink)});
 rect(a,170,620,353,42,C.pale,C.line,5);text(a,'Review variances  •  enter reason  •  submit for approval',181,646,8,'B',C.green);
 footer(a,6);pages.push(a);
}
{
 const a=page('Page design  |  patients & reports');
 label(a,'Patient and prescription-linked dispensing',42,112);
 uiFrame(a,42,130,511,243,'Patient record  /  prescriptions','Patients');
 rect(a,170,174,340,50,C.mint,C.mint,7);text(a,'Patient:  A. Sample  |  Hospital number: GH-004281',183,197,9,'B',C.dark);text(a,'Prescription: Dr. Example  |  18 Oct 2026',183,214,8,'R',C.muted);
 ['Medicine','Dose','Duration','Qty','Label'].forEach((v,i)=>text(a,v,172+i*68,253,7,'B',C.muted));
 ['Amoxicillin 250mg','1 capsule','5 days','15','Preview','Paracetamol 500mg','2 tablets','3 days','18','Preview'].forEach((v,i)=>text(a,v,172+(i%5)*68,280+Math.floor(i/5)*27,7,'R',C.ink));
 rect(a,170,320,337,30,C.pale,C.line,5);text(a,'Check stock and pharmacist directions before dispense',181,339,8,'R',C.muted);
 label(a,'Reports and management view',42,418);
 uiFrame(a,42,436,511,249,'Sales and stock report','Reports');
 pill(a,'Daily',170,484,52);pill(a,'Weekly',230,484,60,C.white);pill(a,'Monthly',298,484,64,C.white);
 rect(a,170,522,336,121,C.pale,C.line,6);text(a,'Sales by day  /  value',183,544,8,'B',C.muted);
 [42,62,48,83,67,101,76].forEach((v,i)=>{a.push(`${hex(i===5?C.green:'#9BC9B6')} rg ${190+i*39} ${625-v} 18 ${v} re f`)});
 text(a,'Export sales, stock movement, expiry and count variance reports by permission.',170,664,8,'R',C.muted);footer(a,7);pages.push(a);
}
{
 const a=page('Page design  |  staff chat & account controls');
 label(a,'Staff chat (text only)',42,112);
 uiFrame(a,42,130,511,215,'Pharmacy team','Staff Chat');
 rect(a,174,179,224,33,C.pale,C.line,8);text(a,'Please verify the OPD stock transfer.',187,200,8,'R',C.ink);
 rect(a,290,224,226,34,C.mint,C.mint,8);text(a,'Received. I will check it now.',303,245,8,'R',C.dark);
 rect(a,174,273,342,37,C.white,C.line,7);text(a,'Type a message  ______________________  Send',185,297,8,'R',C.muted);
 text(a,'New message receive/send can play a short notification sound.',174,328,8,'R',C.muted);
 label(a,'Account & appearance',42,389);
 box(a,42,408,245,185,'PROFILE SETTINGS',['Name and contact information','Change password securely','Generated avatar (no media upload)','Notification and privacy settings','Account session controls'],{size:9,leading:17});
 box(a,303,408,250,185,'APPEARANCE CONTROLS',['Hospital-green default theme','Choose sidebar and topbar colors','Adjust icons and interface accents','Store theme preference per account','Powered by Kowaguru Technology Limited'],{size:9,leading:17});
 rect(a,42,625,511,75,C.white,C.line,9);text(a,'Privacy boundary',58,649,10,'B',C.green);text(a,'Staff chat supports text and built-in reactions. No image, video, document or voice-note uploads.',58,673,9,'R',C.ink);
 footer(a,8);pages.push(a);
}
{
 const a=page('Implementation roadmap & open decisions');
 const stages=[['01  Foundation','Review requirements; prepare server and user roles; import item master and opening stock.'],['02  Stock operations','Receiving, transfers, batch/expiry tracking, physical counts and approved adjustments.'],['03  Sales & dispensing','POS, payment recording, receipt/label printing, patient and prescription workflows.'],['04  Resilience & reporting','Offline queue, synchronization, alerts, daily/weekly/monthly reporting and backups.'],['05  Hardening & rollout','Pilot pharmacy, staff training, restore drill, LAN access and VPN management access.']];
 stages.forEach((s,i)=>{const y=110+i*92;rect(a,42,y,511,75,i===0?C.mint:C.white,i===0?C.mint:C.line,8);text(a,s[0],57,y+24,11,'B',C.green);text(a,s[1],57,y+48,9,'R',C.ink)});
 label(a,'Confirm before implementation sign-off',42,600,C.gold);
 box(a,42,615,511,95,'OPEN ITEMS',['Count frequency, count freeze rules and approval thresholds','Payment-terminal model and integration method; mandatory app tender record','Server / cloud hosting preference, backup retention, RPO and RTO','Import file format and mapping; printers/scanners and medicine label layout','Client accepts NHIS later; confirm any controlled-drug legal requirements when scoped'],{size:8.5,leading:14,fill:'#FFFCF4',stroke:'#EADCB7'});
 footer(a,9);pages.push(a);
}

// Assemble PDF objects, with vector-only page art and standard PDF fonts.
const objects=[];
const add=o=>(objects.push(o),objects.length);
const catalog=add('');const pagesObj=add('');const fontR=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');const fontB=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
const pageIds=[];
for (const cmds of pages){
  const body=cmds.join('\n');const stream=Buffer.from(body,'ascii');
  const content=add(`<< /Length ${stream.length} >>\nstream\n${stream.toString('ascii')}\nendstream`);
  const id=add(`<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${fontR} 0 R /F2 ${fontB} 0 R >> >> /Contents ${content} 0 R >>`);pageIds.push(id);
}
objects[catalog-1]=`<< /Type /Catalog /Pages ${pagesObj} 0 R >>`;
objects[pagesObj-1]=`<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map(i=>`${i} 0 R`).join(' ')}] >>`;
let pdf='%PDF-1.4\n%BKD Planning\n';const offsets=[0];
for(let i=0;i<objects.length;i++){offsets.push(Buffer.byteLength(pdf,'ascii'));pdf+=`${i+1} 0 obj\n${objects[i]}\nendobj\n`;}
const xref=Buffer.byteLength(pdf,'ascii');pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;
for(let i=1;i<offsets.length;i++)pdf+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`;
pdf+=`trailer\n<< /Size ${objects.length+1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
const output=path.join(path.dirname(fileURLToPath(import.meta.url)),'BKD_Pharmacy_Planning_Architecture_and_Design.pdf');
fs.writeFileSync(output,Buffer.from(pdf,'ascii'));
console.log(`Wrote ${pages.length}-page PDF: ${output} (${fs.statSync(output).size} bytes)`);
