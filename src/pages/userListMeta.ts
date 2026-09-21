import type { UserRole, UserStatus } from '../types/user.ts';

/** 角色 → 中文映射 */
export const ROLE_LABEL: Record<UserRole, string> = {
  admin: '管理员',
  editor: '编辑',
  viewer: '访客',
};

/** 状态 → 中文映射 */
export const STATUS_LABEL: Record<UserStatus, string> = {
  active: '正常',
  inactive: '停用',
  banned: '封禁',
};

/** 角色对应的 Badge 颜色 */
export const ROLE_STYLE: Record<UserRole, string> = {
  admin: 'bg-purple-100 text-purple-700',
  editor: 'bg-blue-100 text-blue-700',
  viewer: 'bg-gray-100 text-gray-600',
};

/** 状态对应的 Badge 颜色 */
export const STATUS_STYLE: Record<UserStatus, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-yellow-100 text-yellow-700',
  banned: 'bg-red-100 text-red-700',
};

/** 角色选项 */
export const ROLE_OPTIONS: { value: UserRole; label: string }[] = (
  Object.entries(ROLE_LABEL) as [UserRole, string][]
).map(([value, label]) => ({ value, label }));

/** 状态选项 */
export const STATUS_OPTIONS: { value: UserStatus; label: string }[] = (
  Object.entries(STATUS_LABEL) as [UserStatus, string][]
).map(([value, label]) => ({ value, label }));
