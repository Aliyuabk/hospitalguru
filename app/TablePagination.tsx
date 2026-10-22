'use client';

type Props={total:number;page:number;pageSize:number;onPageChange:(page:number)=>void;onPageSizeChange:(size:number)=>void};
export default function TablePagination({total,page,pageSize,onPageChange,onPageSizeChange}:Props){
  const pages=Math.max(1,Math.ceil(total/pageSize));
  const first=total===0?0:(page-1)*pageSize+1;
  const last=Math.min(page*pageSize,total);
  return <div className="table-bottom">
    <span>Showing {first}–{last} of {total}</span>
    <div className="table-pagination-controls">
      <label>Rows <select aria-label="Rows per page" value={pageSize} onChange={e=>{onPageSizeChange(Number(e.target.value));onPageChange(1)}}><option value={5}>5</option><option value={10}>10</option></select></label>
      <button type="button" aria-label="Previous page" disabled={page<=1} onClick={()=>onPageChange(page-1)}>‹</button>
      <span>Page {page} of {pages}</span>
      <button type="button" aria-label="Next page" disabled={page>=pages} onClick={()=>onPageChange(page+1)}>›</button>
    </div>
  </div>;
}
