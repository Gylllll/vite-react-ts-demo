import http from './http.ts';
import type { PaginatedResponse } from '../types/common.ts';
import type { User, UserQueryParams } from '../types/user.ts';

/**
 * 分页查询用户列表
 * @param params 分页 + 搜索参数
 * @returns 分页用户数据
 */
export const getUserList = (params: UserQueryParams): Promise<PaginatedResponse<User>> => {
  return http.get('/user/list', { params }).then((res) => res.data);
};
