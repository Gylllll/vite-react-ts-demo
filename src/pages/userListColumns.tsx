import type { User } from '../types/user.ts';
import type { Column } from '../components/atom/index.ts';
import { ROLE_LABEL, STATUS_LABEL, ROLE_STYLE, STATUS_STYLE } from './userListMeta.ts';

/** 构建用户列表的表格列定义 */
export const buildUserColumns = (
  onEdit: (user: User) => void,
  onDelete: (user: User) => void,
): Column<User>[] => [
  { key: 'id', title: 'ID', className: 'text-gray-500' },
  { key: 'username', title: '用户名', className: 'font-medium text-gray-800' },
  { key: 'email', title: '邮箱', className: 'text-gray-600' },
  {
    key: 'phone',
    title: '手机号',
    className: 'text-gray-500',
    render: (user) => user.phone || '-',
  },
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
          onClick={() => onEdit(user)}
        >
          编辑
        </button>
        <button
          type="button"
          className="rounded px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
          onClick={() => onDelete(user)}
        >
          删除
        </button>
      </div>
    ),
  },
];
