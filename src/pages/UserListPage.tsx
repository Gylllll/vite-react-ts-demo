import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AxiosError } from 'axios';
import type { PaginatedData } from '../types/common.ts';
import type { User, UserStatus } from '../types/user.ts';
import { getUserList } from '../api/user.ts';
import { Table, Pagination } from '../components/atom/index.ts';
import { STATUS_OPTIONS } from './userListMeta.ts';
import { buildUserColumns } from './userListColumns.tsx';
import UserFormModal from './UserFormModal.tsx';
import DeleteUserModal from './DeleteUserModal.tsx';

const PAGE_SIZE = 5;

const UserListPage: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | ''>('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedData<User> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ----- 新增/编辑弹窗状态 -----
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // ----- 删除确认弹窗状态 -----
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  // 使用 AbortController 取消过期请求
  // fix: 用户快速切换筛选条件 / 翻页时，多个请求同时进行，后发起的请求可能先返回，导致显示数据与筛选条件不一致
  const abortRef = useRef<AbortController | null>(null);

  /** 打开新增弹窗 */
  const openCreateModal = () => {
    setEditingUser(null);
    setModalVisible(true);
  };

  /** 打开编辑弹窗 */
  const openEditModal = useCallback((user: User) => {
    setEditingUser(user);
    setModalVisible(true);
  }, []);

  /** 关闭新增/编辑弹窗 */
  const closeFormModal = () => {
    setModalVisible(false);
    setEditingUser(null);
  };

  /** 打开删除确认 */
  const openDeleteConfirm = useCallback((user: User) => {
    setDeleteTarget(user);
  }, []);

  /** 关闭删除确认弹窗 */
  const closeDeleteModal = () => {
    setDeleteTarget(null);
  };

  // ----- 表格列定义（依赖组件内回调） -----
  const columns = useMemo(
    () => buildUserColumns(openEditModal, openDeleteConfirm),
    [openEditModal, openDeleteConfirm]
  );

  const fetchData = useCallback(async (pageOverride?: number) => {
    // 取消上一个未完成的请求，避免竞态条件
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const res = await getUserList({
        page: pageOverride ?? page,
        pageSize: PAGE_SIZE,
        keyword: searchKeyword || undefined,
        status: statusFilter || undefined,
        sortField: sortOrder ? 'createdAt' : undefined,
        sortOrder: sortOrder || undefined,
      }, controller.signal);
      setData(res.data);
    } catch (err: unknown) {
      // 请求被取消（AbortController / axios）时静默忽略
      if (err instanceof AxiosError && err.code === 'ERR_CANCELED') return;
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.error('获取用户列表失败:', err);
      setError(err instanceof Error ? err.message : '请求失败');
    } finally {
      // 仅当当前请求仍是最新请求时才更新 loading 状态，
      // 防止被 abort 的旧请求的 finally 把 loading 错误置为 false
      if (abortRef.current === controller) {
        setLoading(false);
      }
    }
  }, [page, searchKeyword, statusFilter, sortOrder]);

  useEffect(() => {
    void fetchData();
    return () => {
      // 组件卸载或依赖变化时取消进行中的请求
      abortRef.current?.abort();
    };
  }, [fetchData]);

  const handleSearch = () => {
    setSearchKeyword(keyword.trim());
    setPage(1);
  };

  /** 清空搜索 */
  const clearSearch = () => {
    setKeyword('');
    setSearchKeyword('');
    setPage(1);
  };

  return (
    <main className="flex flex-1 flex-col p-8">
      <div className="mx-auto w-full max-w-5xl">
        {/* 标题 + 新增按钮 */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">用户列表</h1>
          <button
            type="button"
            className="rounded-lg bg-purple-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-600 transition-colors cursor-pointer"
            onClick={openCreateModal}
          >
            + 新增用户
          </button>
        </div>

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

        {/* 筛选 & 排序 */}
        <div className="mt-4 flex gap-3">
          {/* 状态筛选 */}
          <select
            className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-purple-400 focus:ring-2 focus:ring-purple-100 cursor-pointer"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as UserStatus | ''); setPage(1); }}
          >
            <option value="">全部状态</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* 创建时间排序 */}
          <select
            className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-purple-400 focus:ring-2 focus:ring-purple-100 cursor-pointer"
            value={sortOrder}
            onChange={(e) => { setSortOrder(e.target.value as 'asc' | 'desc' | ''); setPage(1); }}
          >
            <option value="">默认排序</option>
            <option value="desc">创建时间 ↓ (新→旧)</option>
            <option value="asc">创建时间 ↑ (旧→新)</option>
          </select>
        </div>

        {/* 表格 */}
        <div className="mt-6">
          <Table<User>
            columns={columns}
            data={data?.list ?? []}
            loading={loading}
            error={error}
            onRetry={() => void fetchData()}
            rowKey={(user) => user.id}
            emptyContent={
              searchKeyword ? (
                <>
                  <p>未搜索到与「{searchKeyword}」相关的用户</p>
                  <button
                    type="button"
                    className="mt-3 text-purple-500 hover:text-purple-600 cursor-pointer"
                    onClick={clearSearch}
                  >
                    清除搜索
                  </button>
                </>
              ) : (
                <p>暂无用户数据</p>
              )
            }
          />
        </div>

        {/* 分页栏 */}
        {data && data.total > 0 && (
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={data.total}
            onChange={setPage}
          />
        )}
      </div>

      {/* 新增/编辑弹窗 */}
      <UserFormModal
        visible={modalVisible}
        editingUser={editingUser}
        onClose={closeFormModal}
        onSuccess={() => { setPage(1); void fetchData(1); }}
      />

      {/* 删除确认弹窗 */}
      <DeleteUserModal
        user={deleteTarget}
        onClose={closeDeleteModal}
        onDeleted={() => { void fetchData(); }}
      />
    </main>
  );
};

export default UserListPage;
