'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import React from 'react';

type LinkEntry = { resource?: string; slug: string; title: string };
const insightResources = ['sales', 'inventory', 'grns', 'transfers', 'audit', 'losses', 'requests'];
const dateValue = (value: unknown) => value ? new Date(String(value)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—';
const cash = (value: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);

export default function DashboardInsights({ workspace, links }: { workspace: string; links: LinkEntry[] }) {
  const [datasets, setDatasets] = useState<Record<string, any[]>>({});
  const [error, setError] = useState('');
  const resourceKey = [...new Set(links.map(item => item.resource).filter((value): value is string => !!value))].sort().join(',');
  useEffect(() => {
    let active = true;
    const allowed = new Set(resourceKey.split(',').filter(Boolean));
    const resources = insightResources.filter(resource => allowed.has(resource));
    Promise.all(resources.map(async resource => {
      const response = await fetch(`/api/admin?resource=${resource}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || `Could not load ${resource}.`);
      return [resource, Array.isArray(body.data) ? body.data : []] as const;
    })).then(rows => { if (active) setDatasets(Object.fromEntries(rows)); })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Dashboard details unavailable.'); });
    return () => { active = false; };
  }, [resourceKey]);

  const sales = datasets.sales || [];
  const salesTrend = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(); day.setHours(0, 0, 0, 0); day.setDate(day.getDate() - (6 - i));
      return { key: day.toDateString(), label: day.toLocaleDateString(undefined, { weekday: 'short' }), total: 0 };
    });
    for (const sale of sales) {
      if (!sale.sold_at || sale.status !== 'completed') continue;
      const key = new Date(sale.sold_at).toDateString();
      const day = days.find(row => row.key === key);
      if (day) day.total += Number(sale.total_ngn || 0);
    }
    return days;
  }, [sales]);
  const maxSales = Math.max(...salesTrend.map(row => row.total), 1);
  const inventory = datasets.inventory || [];
  const distribution = useMemo(() => {
    const totals = new Map<string, number>();
    for (const batch of inventory) {
      if (batch.status !== 'usable' || (batch.expiry_date && new Date(batch.expiry_date) < new Date())) continue;
      const name = String(batch.location_name || 'Assigned location');
      totals.set(name, (totals.get(name) || 0) + Number(batch.quantity_on_hand || 0) * Number(batch.cost_price_ngn || 0));
    }
    return [...totals.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [inventory]);
  const recentSource: { key: string; rows: any[] } = datasets.sales?.length
    ? { key: 'sales', rows: datasets.sales }
    : datasets.grns?.length
      ? { key: 'grns', rows: datasets.grns }
      : datasets.transfers?.length
        ? { key: 'transfers', rows: datasets.transfers }
        : { key: 'audit', rows: datasets.audit || [] };
  const recent = recentSource.rows;
  const alerts = [...(datasets.losses || []), ...(datasets.requests || [])].filter(row => ['expired', 'quarantined', 'pending', 'pending_approval'].includes(String(row.status))).slice(0, 5);

  const h = React.createElement;
  const panel = (title: string, subtitle: string, content: React.ReactNode) => h('section', { className: 'panel chart-panel', key: title },
    h('div', { className: 'card-heading' }, h('div', null, h('h2', null, title), h('p', null, subtitle))), content);
  const bars = h('div', { className: 'dashboard-bars', role: 'img', 'aria-label': 'Seven day sales trend' }, salesTrend.map(row =>
    h('div', { key: row.key, title: `${row.label}: ${cash(row.total)}` }, h('span', { style: { height: `${Math.max(5, row.total / maxSales * 100)}%` } }), h('small', null, row.label))));
  const inventoryRows = distribution.length
    ? h('div', { className: 'dashboard-distribution' }, distribution.map((row, index) => h('div', { className: 'distribution-row', key: row.name },
      h('span', { className: `distribution-dot dot-${index % 5}` }), h('span', null, row.name), h('b', null, cash(row.value)))))
    : h('div', { className: 'dashboard-insight-empty' }, error || 'No authorized, usable inventory records are available.');
  const recentRows = recent.length ? h('div', { className: 'dashboard-records' }, recent.slice(0, 5).map((row, index) =>
    h('div', { key: row.id || row.invoice_no || row.grn_no || row.transfer_no || index },
      h('span', null, h('b', null, row.invoice_no || row.grn_no || row.transfer_no || row.reference_no || row.action || 'Record'),
        h('small', null, row.location_name || row.supplier || row.destination_location || row.actor_name || row.status)),
      h('small', null, dateValue(row.sold_at || row.created_at || row.occurred_at)))))
    : h('div', { className: 'dashboard-insight-empty' }, 'No recent records in this authorized view.');
  const alertRows = alerts.length ? h('div', { className: 'dashboard-records' }, alerts.map((row, index) =>
    h('div', { key: row.id || row.request_no || row.batch_no || index },
      h('span', null, h('b', null, row.generic_name || row.request_no || row.batch_no || 'Workflow item'),
        h('small', null, `${row.status} · ${row.location_name || row.requesting_location || row.destination_location || ''}`)),
      h('small', null, dateValue(row.expiry_date || row.created_at)))))
    : h('div', { className: 'dashboard-insight-empty' }, 'No active items in the authorized queues.');
  return h('div', { className: 'dashboard-insights' },
    h('div', { className: 'dashboard-grid dashboard-insight-grid' },
      panel('Sales trend', 'Completed sales for the last seven days', sales.length ? bars : h('div', { className: 'dashboard-insight-empty' }, error || 'No completed sales in the last seven days.')),
      panel('Stock value by location', 'Usable, unexpired inventory at cost', inventoryRows)),
    h('div', { className: 'dashboard-grid dashboard-insight-grid' },
      h('section', { className: 'panel' }, h('div', { className: 'card-heading' }, h('div', null, h('h2', null, 'Recent activity'), h('p', null, 'Records in your authorized scope')),
        h(Link, { className: 'text-button', href: `/${workspace}/${recentSource.key === 'audit' ? 'audit-logs' : recentSource.key}` }, 'View all →')), recentRows),
      h('section', { className: 'panel' }, h('div', { className: 'card-heading' }, h('div', null, h('h2', null, 'Attention queue'), h('p', null, 'Exceptions and pending work')),
        h('span', { className: 'soft-pill soft-amber' }, `${alerts.length} items`)), alertRows)));
}
