/** 用户状态 */
export type UserStatus = 'active' | 'inactive' | 'banned';

/** 用户角色 */
export type UserRole = 'admin' | 'editor' | 'viewer';

/** 用户基础类型 */
export interface User {
  id: number;
  username: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

/** 分页数据 */
export interface PaginatedData<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** API 响应体 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
