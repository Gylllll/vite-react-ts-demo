import { useState, useEffect, useCallback } from 'react';
import type { PaginatedData } from '../types/common.ts';
import type { User, UserStatus, UserRole } from '../types/user.ts';
import { getUserList } from '../api/user.ts';

const PAGE_SIZE = 10;

/** 角色 → 中文映射 */
const ROLE_LABEL: Record<UserRole, string> = {
  admin: '管理员',
  editor: '编辑',
  viewer: '访客',
};

/** 状态 → 中文映射 */
const STATUS_LABEL: Record<UserStatus, string> = {
  active: '正常',
  inactive: '停用',
  banned: '封禁',
};

/** 角色对应的 Badge 颜色 */
const ROLE_STYLE: Record<UserRole, string> = {
  admin: 'bg-purple-100 text-purple-700',
  editor: 'bg-blue-100 text-blue-700',
  viewer: 'bg-gray-100 text-gray-600',
};

/** 状态对应的 Badge 颜色 */
const STATUS_STYLE: Record<UserStatus, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-yellow-100 text-yellow-700',
  banned: 'bg-red-100 text-red-700',
};

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

const UserListPage: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedData<User> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getUserList({
        page,
        pageSize: PAGE_SIZE,
        keyword: searchKeyword || undefined,
      });
      setData(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败');
    } finally {
      setLoading(false);
    }
  }, [page, searchKeyword]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleSearch = () => {
    setSearchKeyword(keyword.trim());
    setPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));
    if (nextPage < 1 || nextPage > totalPages) return;
    setPage(nextPage);
  };

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));
  const pageNumbers = getPageNumbers(page, totalPages);

  /** 渲染表格内容 */
  const renderTableBody = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
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

    if (error) {
      return (
        <tr>
          <td colSpan={6} className="px-6 py-16 text-center">
            <p className="text-red-500">{error}</p>
            <button
              type="button"
              className="mt-3 rounded bg-purple-500 px-4 py-2 text-sm text-white hover:bg-purple-600 transition-colors cursor-pointer"
              onClick={() => void fetchData()}
            >
              重新加载
            </button>
          </td>
        </tr>
      );
    }

    if (!data || data.list.length === 0) {
      return (
        <tr>
          <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
            {searchKeyword ? (
              <>
                <p>未搜索到与「{searchKeyword}」相关的用户</p>
                <button
                  type="button"
                  className="mt-3 text-purple-500 hover:text-purple-600 cursor-pointer"
                  onClick={() => { setKeyword(''); setSearchKeyword(''); setPage(1); }}
                >
                  清除搜索
                </button>
              </>
            ) : (
              <p>暂无用户数据</p>
            )}
          </td>
        </tr>
      );
    }

    return data.list.map((user) => (
      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
        <td className="px-6 py-3 text-sm text-gray-500">{user.id}</td>
        <td className="px-6 py-3 text-sm font-medium text-gray-800">{user.username}</td>
        <td className="px-6 py-3 text-sm text-gray-600">{user.email}</td>
        <td className="px-6 py-3">
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_STYLE[user.role]}`}>
            {ROLE_LABEL[user.role]}
          </span>
        </td>
        <td className="px-6 py-3">
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[user.status]}`}>
            {STATUS_LABEL[user.status]}
          </span>
        </td>
        <td className="px-6 py-3 text-sm text-gray-500">{user.createdAt}</td>
      </tr>
    ));
  };

  return (
    <main className="flex flex-1 flex-col p-8">
      <div className="mx-auto w-full max-w-5xl">
        {/* 标题 */}
        <h1 className="text-2xl font-bold text-gray-800">用户列表</h1>

        {/* 搜索栏 */}
        <div className="mt-6 flex gap-3">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm text-gray-700 placeholder-gray-400 outline-none transition-colors focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              placeholder="搜索用户名或邮箱"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            />
          </div>
          <button
            type="button"
            className="rounded-lg bg-purple-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-purple-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSearch}
            disabled={loading}
          >
            搜索
          </button>
        </div>

        {/* 表格 */}
        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户名</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">邮箱</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {renderTableBody()}
              </tbody>
            </table>
          </div>
        </div>

        {/* 分页栏 */}
        {data && data.total > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-gray-500">
              第 {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, data.total)} 条 / 共 {data.total} 条
            </span>

            <div className="flex items-center gap-1">
              {/* 上一页 */}
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
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
                    onClick={() => handlePageChange(p)}
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
                onClick={() => handlePageChange(page + 1)}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default UserListPage;
