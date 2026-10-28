const fs = require('node:fs');
const path = 'app/[workspace]/[[...section]]/page.tsx';
let source = fs.readFileSync(path, 'utf8');
source = source.replace(
  /^function Empty\(\{title,note\}:\{title:string;note:string\}\)\{.*\}$/m,
  "function Empty({title,note}:{title:string;note:string}){const isLoading=title.toLowerCase().startsWith('loading');return <div className={'empty-state'+(isLoading?' empty-loading':'')} role={isLoading?'status':undefined} aria-busy={isLoading||undefined}>{isLoading?<div className=\"table-skeleton\" aria-hidden=\"true\"><i/><i/><i/><i/></div>:<div className=\"empty-mark\">{String.fromCharCode(0x25cb)}</div>}<strong>{title}</strong><span>{isLoading?'Loading authorized data...':note}</span></div>}"
);
source = source.replace(
  /<strong className="metric-value">\{error\?[^<]*<\/strong><div className="metric-caption">Authorized data/,
  '<strong className="metric-value">{loading&&!error?<span className="metric-skeleton" aria-label="Loading metric"/>:error?\'—\':dashboardMetric(workspace,label,row,\'—\')}</strong><div className="metric-caption">Authorized data'
);
source = source.replace(
  /<b>\{a==='Records'&&loading\?[^<]*<\/b>/,
  '<b>{a===\'Records\'&&loading?<span className="metric-skeleton" aria-label="Loading count"/>:b}</b>'
);
fs.writeFileSync(path, source, 'utf8');

const pharmacyPath = 'app/pharmacy/PharmacyWorkspace.tsx';
let pharmacy = fs.readFileSync(pharmacyPath, 'utf8');
pharmacy = pharmacy.replace(
  /<strong className="metric-value">\{dashboardMetric\('pharmacy',label,metrics,loading\?[^}]*\)\}<\/strong>/,
  '<strong className="metric-value">{loading?<span className="metric-skeleton" aria-label="Loading metric"/>:dashboardMetric(\'pharmacy\',label,metrics,\'—\')}</strong>'
);
fs.writeFileSync(pharmacyPath, pharmacy, 'utf8');
