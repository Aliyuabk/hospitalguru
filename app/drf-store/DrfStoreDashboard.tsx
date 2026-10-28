'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { dashboardMetric } from '@/lib/metrics';
import LoadingIndicator from '@/app/LoadingIndicator';

type Props = {
  metrics: Record<string, any>;
  loading: boolean;
  error: string;
  permissions: Set<string>;
};

type Lists = {
  grns: any[];
  requests: any[];
  transfers: any[];
  losses: any[];
};

const emptyLists: Lists = { grns: [], requests: [], transfers: [], losses: [] };

export default function DrfStoreDashboard({ metrics, loading, error, permissions }: Props) {
  const [lists, setLists] = useState<Lists>(emptyLists);
  const [listsLoading, setListsLoading] = useState(true);
  const [listError, setListError] = useState('');

  useEffect(() => {
    let active = true;
    setListsLoading(true);
    Promise.all(
      ([
        ...(permissions.has('grns.view') ? ['grns' as const] : []),
        ...(permissions.has('stock_requests.view') ? ['requests' as const] : []),
        ...(permissions.has('transfers.view') ? ['transfers' as const] : []),
        ...(permissions.has('inventory.view') ? ['losses' as const] : []),
      ]).map(async resource => {
        const response = await fetch(`/api/admin?resource=${resource}`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || `Could not load ${resource}.`);
        return [resource, Array.isArray(result.data) ? result.data : []] as const;
      }),
    )
      .then(results => {
        if (!active) return;
        // Only request resources this account can view; fill the rest with
        // empty arrays so a permission-filtered response never breaks render.
        setLists({ ...emptyLists, ...Object.fromEntries(results) } as Lists);
        setListError('');
      })
      .catch(reason => {
        if (!active) return;
        setListError(reason instanceof Error ? reason.message : 'Could not load Store Keeper records.');
      })
      .finally(() => {
        if (active) setListsLoading(false);
      });
    return () => { active = false; };
  }, [permissions]);

  const kpis = [
    ['Usable stock', 'usable_stock_units', 'inventory.view', 'Units available across assigned central store locations'],
    ['GRNs pending review', 'pending_grns', 'grns.view', 'Awaiting the next authorized workflow step'],
    ['Pharmacy requests', 'pending_requests', 'stock_requests.view', 'Waiting for central store review'],
    ['Transfers in transit', 'transfers_in_transit', 'transfers.view', 'Dispatched and not fully received'],
    ['Returns to inspect', 'pending_returns', 'returns.view', 'Physically returned to the central store'],
    ['Low-stock products', 'low_stock_products', 'inventory.view', 'Below configured reorder levels'],
  ] as const;
  const visibleKpis = kpis.filter(([, key, permission]) => permissions.has(permission) && (loading || Object.prototype.hasOwnProperty.call(metrics, key)));

  return <div className="drf-dashboard">
    <div className="drf-store-banner">
      <div className="drf-store-mark" aria-hidden="true">+</div>
      <div><span className="eyebrow">CENTRAL INVENTORY AUTHORITY</span><h2>DRF STORE operations</h2><p>Receiving, batch traceability, pharmacy fulfilment, and stock movement.</p></div>
      <span className={`drf-live-state ${error ? 'drf-live-error' : ''}`}><i />{error ? 'Data unavailable' : loading ? <LoadingIndicator>Updating</LoadingIndicator> : 'Live workspace'}</span>
    </div>

    {error && <div className="inline-error">{error}</div>}
    <div className="kpi-grid drf-kpi-grid">
      {visibleKpis.map(([label, key, , caption], index) => <article className="kpi-card" key={key}>
        <div className="kpi-top"><span>{label}</span><i className={`metric-icon ${['teal','blue','amber','red'][index % 4]}`}>{['▦','⇩','⇢','⇄','↩','⌕'][index]}</i></div>
        <strong className="metric-value">{loading ? <LoadingIndicator className="metric-loading">Loading</LoadingIndicator> : dashboardMetric('drf-store', label, metrics, '—')}</strong>
        <div className="metric-caption">{caption}</div>
      </article>)}
    </div>

    <div className="drf-quick-actions">
      {permissions.has('grns.create')&&<Link href="/drf-store/grns/create"><span>＋</span><div><b>Record delivery</b><small>Start a goods receipt draft</small></div><i>→</i></Link>}
      {permissions.has('stock_requests.view')&&<Link href="/drf-store/requests"><span>⇢</span><div><b>Review pharmacy requests</b><small>Check requested quantities and availability</small></div><i>→</i></Link>}
      {permissions.has('transfers.create')&&<Link href="/drf-store/transfers/create"><span>⇄</span><div><b>Prepare a transfer</b><small>Choose a destination pharmacy</small></div><i>→</i></Link>}
      {permissions.has('stock_counts.create')&&<Link href="/drf-store/stock-count"><span>▦</span><div><b>Start a stock count</b><small>Reconcile physical batch quantities</small></div><i>→</i></Link>}
    </div>

    {listError && <div className="inline-error">{listError}</div>}
    <div className="drf-section-grid">
      {permissions.has('grns.view')&&<section className="panel drf-list-panel">
        <div className="card-heading"><div><h2>Recent goods received</h2><p>Latest deliveries and their current status</p></div><Link className="text-button" href="/drf-store/grns">All GRNs →</Link></div>
        <div className="drf-record-list">{lists.grns.slice(0, 5).map((row, index) => <Link className="drf-record" href="/drf-store/grns" key={row.grn_no || index}>
          <span className="drf-record-icon">GR</span><span className="drf-record-main"><b>{row.grn_no}</b><small>{row.supplier} · {row.location_name}</small></span><span className={`soft-pill ${row.status === 'posted' ? '' : 'soft-amber'}`}>{row.status}</span>
        </Link>)}{!lists.grns.length && <div className="drf-empty">{listsLoading ? <LoadingIndicator>Loading goods receipts…</LoadingIndicator> : 'No goods receipts recorded yet.'}</div>}</div>
      </section>}

      {permissions.has('stock_requests.view')&&<section className="panel drf-list-panel">
        <div className="card-heading"><div><h2>Pharmacy requests</h2><p>Requests addressed to DRF STORE</p></div><Link className="text-button" href="/drf-store/requests">All requests →</Link></div>
        <div className="drf-record-list">{lists.requests.slice(0, 5).map((row, index) => <Link className="drf-record" href="/drf-store/requests" key={row.request_no || index}>
          <span className="drf-record-icon request-icon">⇢</span><span className="drf-record-main"><b>{row.request_no}</b><small>{row.requesting_location} · {row.priority} priority</small></span><span className={`soft-pill ${row.status === 'pending' ? 'soft-amber' : ''}`}>{row.status}</span>
        </Link>)}{!lists.requests.length && <div className="drf-empty">{listsLoading ? <LoadingIndicator>Loading pharmacy requests…</LoadingIndicator> : 'No pharmacy requests waiting.'}</div>}</div>
      </section>}

      {permissions.has('transfers.view')&&<section className="panel drf-list-panel">
        <div className="card-heading"><div><h2>Transfers in transit</h2><p>Dispatched stock awaiting pharmacy receipt</p></div><Link className="text-button" href="/drf-store/transfers">All transfers →</Link></div>
        <div className="drf-record-list">{lists.transfers.filter(row => ['in_transit', 'partially_received'].includes(row.status)).slice(0, 5).map((row, index) => <Link className="drf-record" href="/drf-store/transfers" key={row.transfer_no || index}>
          <span className="drf-record-icon transfer-icon">⇄</span><span className="drf-record-main"><b>{row.transfer_no}</b><small>{row.destination_location} · {row.generic_name}</small></span><span className="soft-pill soft-amber">{row.status.replaceAll('_', ' ')}</span>
        </Link>)}{!listsLoading && !lists.transfers.some(row => ['in_transit', 'partially_received'].includes(row.status)) && <div className="drf-empty">No transfers are currently in transit.</div>}{listsLoading && <div className="drf-empty"><LoadingIndicator>Loading transfers…</LoadingIndicator></div>}</div>
      </section>}

      {permissions.has('inventory.view')&&<section className="panel drf-list-panel">
        <div className="card-heading"><div><h2>Expiry & quarantine attention</h2><p>Batch records requiring a closer look</p></div><Link className="text-button" href="/drf-store/expiry">Review alerts →</Link></div>
        <div className="drf-record-list">{lists.losses.slice(0, 5).map((row, index) => <Link className="drf-record" href="/drf-store/expiry" key={`${row.sku}-${row.batch_no}-${index}`}>
          <span className="drf-record-icon alert-icon">!</span><span className="drf-record-main"><b>{row.generic_name}</b><small>{row.sku} · Batch {row.batch_no} · Expires {row.expiry_date?.slice?.(0, 10) || row.expiry_date}</small></span><span className="soft-pill soft-amber">{row.status}</span>
        </Link>)}{!lists.losses.length && <div className="drf-empty">{listsLoading ? <LoadingIndicator>Loading batch alerts…</LoadingIndicator> : 'No expiry or quarantine alerts.'}</div>}</div>
      </section>}
    </div>

    <div className="approval-rule"><b>Stock control</b><span>Drafts and requests do not change on-hand stock. Inventory updates only through authorized posting, dispatch, receipt, and audit workflows.</span></div>
  </div>;
}
