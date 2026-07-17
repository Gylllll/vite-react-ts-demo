import { useState, useEffect, useCallback, useMemo } from 'react';
import type { PaginatedData } from '../types/common.ts';
import type { User, UserStatus, UserRole, CreateUserParams } from '../types/user.ts';
import { getUserList, createUser, updateUser, deleteUser } from '../api/user.ts';
import { Table, Pagination, Modal } from '../components/atom/index.ts';
import type { Column } from '../components/atom/index.ts';

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

/** 角色选项 */
const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'admin', label: '管理员' },
  { value: 'editor', label: '编辑' },
  { value: 'viewer', label: '访客' },
];

/** 状态选项 */
const STATUS_OPTIONS: { value: UserStatus; label: string }[] = [
  { value: 'active', label: '正常' },
  { value: 'inactive', label: '停用' },
  { value: 'banned', label: '封禁' },
];

/** 表单初始值 */
const INITIAL_FORM: CreateUserParams = {
  username: '',
  email: '',
  role: 'viewer',
  status: 'active',
};


const UserListPage: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedData<User> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ----- 新增/编辑弹窗状态 -----
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<CreateUserParams>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ----- 删除确认弹窗状态 -----
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ----- 表格列定义（依赖组件内回调） -----
  const columns: Column<User>[] = useMemo(
    () => [
      { key: 'id', title: 'ID', className: 'text-gray-500' },
      { key: 'username', title: '用户名', className: 'font-medium text-gray-800' },
      { key: 'email', title: '邮箱', className: 'text-gray-600' },
      {
        key: 'role',
        title: '角色',
        render: (user) => (
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_STYLE[user.role]}`}>
            {ROLE_LABEL[user.role]}
          </span>
        ),
      },
      {
        key: 'status',
        title: '状态',
        render: (user) => (
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[user.status]}`}>
            {STATUS_LABEL[user.status]}
          </span>
        ),
      },
      { key: 'createdAt', title: '创建时间', className: 'text-gray-500' },
      {
        key: 'actions',
        title: '操作',
        render: (user) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded px-2.5 py-1 text-xs font-medium text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
              onClick={() => openEditModal(user)}
            >
              编辑
            </button>
            <button
              type="button"
              className="rounded px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
              onClick={() => openDeleteConfirm(user)}
            >
              删除
            </button>
          </div>
        ),
      },
    ],
    [], // eslint-disable-line react-hooks/exhaustive-deps -- 回调函数引用稳定
  );

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

  // ----- 新增/编辑弹窗 -----

  /** 打开新增弹窗 */
  const openCreateModal = () => {
    setEditingUser(null);
    setFormData(INITIAL_FORM);
    setFormError(null);
    setModalVisible(true);
  };

  /** 打开编辑弹窗 */
  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
    });
    setFormError(null);
    setModalVisible(true);
  };

  /** 关闭弹窗 */
  const closeModal = () => {
    if (submitting) return;
    setModalVisible(false);
    setEditingUser(null);
    setFormError(null);
  };

  /** 表单字段变更 */
  const handleFormChange = (field: keyof CreateUserParams, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formError) setFormError(null);
  };

  /** 提交表单（新增 / 编辑） */
  const handleFormSubmit = async () => {
    // 表单校验
    if (!formData.username.trim()) {
      setFormError('请输入用户名');
      return;
    }
    if (!formData.email.trim()) {
      setFormError('请输入邮箱');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setFormError('请输入有效的邮箱地址');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      if (editingUser) {
        await updateUser({ id: editingUser.id, ...formData });
      } else {
        await createUser(formData);
      }
      closeModal();
      setPage(1);
      void fetchData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  // ----- 删除确认 -----

  /** 打开删除确认 */
  const openDeleteConfirm = (user: User) => {
    setDeleteTarget(user);
  };

  /** 确认删除 */
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUser(deleteTarget.id);
      setDeleteTarget(null);
      void fetchData();
    } catch (err) {
      // 删除失败仅打印日志，关闭弹窗
      console.error('删除失败:', err);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
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

      {/* ==================== 新增/编辑弹窗 ==================== */}
      <Modal
        visible={modalVisible}
        title={editingUser ? '编辑用户' : '新增用户'}
        onClose={closeModal}
        loading={submitting}
        footer={
          <>
            <button
              type="button"
              className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={closeModal}
              disabled={submitting}
            >
              取消
            </button>
            <button
              type="button"
              className="rounded-lg bg-purple-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => void handleFormSubmit()}
              disabled={submitting}
            >
              {submitting ? '保存中...' : '保存'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {/* 用户名 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              用户名 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 outline-none transition-colors focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              placeholder="请输入用户名"
              value={formData.username}
              onChange={(e) => handleFormChange('username', e.target.value)}
              disabled={submitting}
            />
          </div>

          {/* 邮箱 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              邮箱 <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 outline-none transition-colors focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              placeholder="请输入邮箱"
              value={formData.email}
              onChange={(e) => handleFormChange('email', e.target.value)}
              disabled={submitting}
            />
          </div>

          {/* 角色 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">角色</label>
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-purple-400 focus:ring-2 focus:ring-purple-100 cursor-pointer"
              value={formData.role}
              onChange={(e) => handleFormChange('role', e.target.value)}
              disabled={submitting}
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 状态 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">状态</label>
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-purple-400 focus:ring-2 focus:ring-purple-100 cursor-pointer"
              value={formData.status}
              onChange={(e) => handleFormChange('status', e.target.value)}
              disabled={submitting}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 错误提示 */}
          {formError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-500">{formError}</p>
          )}
        </div>
      </Modal>

      {/* ==================== 删除确认弹窗 ==================== */}
      <Modal
        visible={!!deleteTarget}
        title={
          deleteTarget ? (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">确认删除</h3>
                <p className="text-sm text-gray-500">
                  确定要删除用户「{deleteTarget.username}」吗？此操作不可撤销。
                </p>
              </div>
            </div>
          ) : null
        }
        onClose={() => { if (!deleting) setDeleteTarget(null); }}
        loading={deleting}
        footer={
          <>
            <button
              type="button"
              className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              取消
            </button>
            <button
              type="button"
              className="rounded-lg bg-red-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => void handleDeleteConfirm()}
              disabled={deleting}
            >
              {deleting ? '删除中...' : '确认删除'}
            </button>
          </>
        }
      >
        {/* 删除确认弹窗的内容已整合到 title 中（图标 + 文字布局） */}
      </Modal>
    </main>
  );
};

export default UserListPage;
