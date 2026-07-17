import type { ListQueryParams } from './common.ts';

/** 用户状态 */
export type UserStatus = 'active' | 'inactive' | 'banned';

/** 用户角色 */
export type UserRole = 'admin' | 'editor' | 'viewer';

/** 用户基础类型 */
export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

/** 用户列表查询参数（分页 + 搜索） */
export interface UserQueryParams extends ListQueryParams {
  /** 搜索关键词（匹配用户名 / 邮箱） */
  keyword?: string;
}

/** 新增用户参数 */
export interface CreateUserParams {
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

/** 编辑用户参数 */
export interface UpdateUserParams extends CreateUserParams {
  id: number;
}
