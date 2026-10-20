'use client';

import { useEffect } from 'react';

type TableState = {
  controls: HTMLDivElement;
  page: number;
  pageSize: number;
  signature: string;
};

/** Adds the same small, client-side pager to every rendered data table. */
export function TablePagination() {
  useEffect(() => {
    const states = new WeakMap<HTMLTableElement, TableState>();
    let scheduled = false;

    const rowsFor = (table: HTMLTableElement) => Array.from(table.tBodies).flatMap((body) =>
      Array.from(body.rows).filter((row) => !(row.cells.length === 1 && row.cells[0].hasAttribute('colspan'))),
    );

    const refresh = () => {
      scheduled = false;
      document.querySelectorAll<HTMLTableElement>('table').forEach((table) => {
        const rows = rowsFor(table);
        if (!rows.length) return;

        let state = states.get(table);
        if (!state) {
          const controls = document.createElement('div');
          controls.className = 'flex flex-wrap items-center justify-between gap-3 border-t border-[#edf1ef] px-4 py-3 text-xs text-[#71847b]';
          controls.setAttribute('data-table-pagination', 'true');
          controls.innerHTML = '<span data-page-summary></span><div class="flex items-center gap-2"><label class="flex items-center gap-2">Rows per page <select aria-label="Rows per page" class="rounded-lg border border-[#e3eae6] bg-white px-2 py-1.5 text-xs"><option value="5">5</option><option value="10">10</option></select></label><button type="button" data-page-prev class="rounded-lg border border-[#e3eae6] px-3 py-1.5 font-semibold disabled:opacity-40">Previous</button><button type="button" data-page-next class="rounded-lg border border-[#e3eae6] px-3 py-1.5 font-semibold disabled:opacity-40">Next</button></div>';
          const wrapper = table.closest<HTMLElement>('.overflow-x-auto') || table;
          wrapper.insertAdjacentElement('afterend', controls);
          state = { controls, page: 1, pageSize: 5, signature: '' };
          states.set(table, state);
          const select = controls.querySelector<HTMLSelectElement>('select')!;
          select.addEventListener('change', () => {
            state!.pageSize = Number(select.value) === 10 ? 10 : 5;
            state!.page = 1;
            schedule();
          });
          controls.querySelector<HTMLButtonElement>('[data-page-prev]')!.addEventListener('click', () => {
            state!.page = Math.max(1, state!.page - 1);
            schedule();
          });
          controls.querySelector<HTMLButtonElement>('[data-page-next]')!.addEventListener('click', () => {
            state!.page += 1;
            schedule();
          });
        }

        const signature = rows.map((row) => row.textContent || '').join('\u001f');
        if (state.signature && state.signature !== signature) state.page = 1;
        state.signature = signature;
        const pageCount = Math.max(1, Math.ceil(rows.length / state.pageSize));
        state.page = Math.min(state.page, pageCount);
        const start = (state.page - 1) * state.pageSize;
        const end = Math.min(start + state.pageSize, rows.length);
        rows.forEach((row, index) => { row.hidden = index < start || index >= end; });
        const summary = state.controls.querySelector('[data-page-summary]')!;
        const summaryText = `Showing ${start + 1}–${end} of ${rows.length}`;
        if (summary.textContent !== summaryText) summary.textContent = summaryText;
        state.controls.querySelector<HTMLButtonElement>('[data-page-prev]')!.disabled = state.page <= 1;
        state.controls.querySelector<HTMLButtonElement>('[data-page-next]')!.disabled = state.page >= pageCount;
        state.controls.querySelector<HTMLSelectElement>('select')!.value = String(state.pageSize);
      });
    };

    function schedule() {
      if (scheduled) return;
      scheduled = true;
      queueMicrotask(refresh);
    }

    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    refresh();
    return () => observer.disconnect();
  }, []);

  return null;
}
