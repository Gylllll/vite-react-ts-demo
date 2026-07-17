import type { ReactNode } from 'react';

/** 列定义 */
export interface Column<T> {
  key: string;
  title: string;
  /** 自定义渲染，若不提供则默认输出 `String(item[key])` */
  render?: (item: T, index: number) => ReactNode;
  /** 附加到 `<td>` 上的 className */
  className?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  /** 数据加载中 */
  loading?: boolean;
  /** 错误信息 */
  error?: string | null;
  /** 重试回调 */
  onRetry?: () => void;
  /** 行 key 生成（index 为 data 中的下标） */
  rowKey: (item: T, index: number) => string | number;
  /** 空数据占位内容（支持 ReactNode 以适配搜索无结果等场景） */
  emptyContent?: ReactNode;
}

function defaultRender<T>(item: T, key: string): ReactNode {
  const value = (item as Record<string, unknown>)[key];
  if (value === null || value === undefined) return '';
  return String(value);
}

const Table = <T,>({
  columns,
  data,
  loading = false,
  error = null,
  onRetry,
  rowKey,
  emptyContent,
}: TableProps<T>): React.ReactElement => {
  const colSpan = columns.length;

  const renderBody = () => {
    // loading
    if (loading) {
      return (
        <tr>
          <td colSpan={colSpan} className="px-6 py-16 text-center text-gray-400">
            <div className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5 animate-spin text-purple-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              加载中...
            </div>
          </td>
        </tr>
      );
    }

    // error
    if (error) {
      return (
        <tr>
          <td colSpan={colSpan} className="px-6 py-16 text-center">
            <p className="text-red-500">{error}</p>
            {onRetry && (
              <button
                type="button"
                className="mt-3 rounded bg-purple-500 px-4 py-2 text-sm text-white hover:bg-purple-600 transition-colors cursor-pointer"
                onClick={onRetry}
              >
                重新加载
              </button>
            )}
          </td>
        </tr>
      );
    }

    // empty
    if (data.length === 0) {
      return (
        <tr>
          <td colSpan={colSpan} className="px-6 py-16 text-center text-gray-400">
            {emptyContent ?? <p>暂无数据</p>}
          </td>
        </tr>
      );
    }

    // data rows
    return data.map((item, index) => (
      <tr key={rowKey(item, index)} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
        {columns.map((col) => (
          <td key={col.key} className={`px-6 py-3 text-sm ${col.className ?? ''}`}>
            {col.render ? col.render(item, index) : defaultRender(item, col.key)}
          </td>
        ))}
      </tr>
    ));
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {renderBody()}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
