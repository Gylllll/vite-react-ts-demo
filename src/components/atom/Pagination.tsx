import type { PaginationParams } from '../../types/common.ts';

export interface PaginationProps extends PaginationParams {
  total: number;
  onChange: (page: number) => void;
}

/**
 * 生成可见页码（带省略号）
 */
function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '...')[] = [1];

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) pages.push('...');

  pages.push(total);
  return pages;
}

const Pagination: React.FC<PaginationProps> = ({ page, pageSize, total, onChange }) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageNumbers = getPageNumbers(page, totalPages);

  const handleChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    onChange(nextPage);
  };

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <span className="text-sm text-gray-500">
        第 {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} 条 / 共 {total} 条
      </span>

      <div className="flex items-center gap-1">
        {/* 上一页 */}
        <button
          type="button"
          className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          disabled={page <= 1}
          onClick={() => handleChange(page - 1)}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* 页码 */}
        {pageNumbers.map((p, idx) =>
          p === '...' ? (
            <span key={`ellipsis-${idx}`} className="px-2 py-2 text-sm text-gray-400 select-none">
              ...
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`min-w-[36px] rounded-lg px-2 py-2 text-sm transition-colors cursor-pointer ${
                p === page
                  ? 'bg-purple-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => handleChange(p)}
            >
              {p}
            </button>
          ),
        )}

        {/* 下一页 */}
        <button
          type="button"
          className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          disabled={page >= totalPages}
          onClick={() => handleChange(page + 1)}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Pagination;
