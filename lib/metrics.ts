const metricMap:Record<string,Record<string,string>>={
    cmd:{'Total Stock Value':'stock_value_ngn',"Today's Sales":'today_sales_ngn','Low-stock products':'low_stock_products','Expiring products':'expiring_products','Pending approvals':'pending_approvals','Stock write-offs':'pending_writeoffs'},
    'head-pharmacist':{'Pending GRNs':'pending_grns','Pending returns':'pending_returns','Stock adjustments':'pending_adjustments','Pending write-offs':'pending_writeoffs','Expiry alerts':'expiring_products','Quality alerts':'system_alerts'},
    'drf-store':{'Usable stock':'usable_stock_units','Pending GRNs':'pending_grns','Pharmacy requests':'pending_requests','Transfers in transit':'transfers_in_transit','Returns to inspect':'pending_returns','Low-stock products':'low_stock_products'},
    pharmacy:{"Today's sales":'today_sales_ngn','Transactions today':'today_transactions','Pending payments':'pending_payments','Low-stock products':'low_stock_products'},
    'pharmacy-supervisor':{"Today's sales":'today_sales_ngn','Payment discrepancies':'payment_discrepancies','Outstanding invoices':'outstanding_invoices','Pending stock requests':'pending_requests','Returns awaiting action':'pending_returns','Day-close status':'day_close_status'},
    cashier:{'Payments recorded today':'payments_today','Pending verification':'pending_payments','Failed payments':'failed_payments','Refund requests':'refund_requests','Unreconciled transactions':'unreconciled_transactions'},
    procurement:{'Below reorder level':'low_stock_products','Purchase requests':'pending_purchase_requests','Open purchase orders':'open_purchase_orders','Recent deliveries':'recent_deliveries'},
    auditor:{'Transactions reviewed':'audit_events_today','Audit exceptions':'audit_exceptions','Stock discrepancies':'stock_discrepancies','Incomplete workflows':'pending_approvals','Write-off activity':'writeoff_activity'},
    'system-admin':{'System status':'database_connectivity','Database connectivity':'database_connectivity','Open alerts':'system_alerts','Backup status':'backup_status'},
  };
export function dashboardMetricKey(workspace:string,label:string){return metricMap[workspace]?.[label]}
export function dashboardMetric(workspace:string,label:string,row:Record<string,any>,fallback:string){
  const key=dashboardMetricKey(workspace,label);if(!key)return fallback;const value=row[key];if(value===undefined||value===null)return fallback;
  if(key.endsWith('_ngn'))return new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}).format(Number(value));
  if(key==='database_connectivity')return String(value);
  return String(value);
}
