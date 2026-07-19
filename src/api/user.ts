import http from "./http.ts";
import type { ApiResponse, PaginatedResponse } from "../types/common.ts";
import type {
  User,
  UserQueryParams,
  CreateUserParams,
  UpdateUserParams,
} from "../types/user.ts";

/**
 * 分页查询用户列表
 * @param params 分页 + 搜索参数
 * @returns 分页用户数据
 */
export const getUserList = (
  params: UserQueryParams,
  signal?: AbortSignal,
): Promise<PaginatedResponse<User>> => {
  return http.get("/user/list", { params, signal }).then((res) => res.data);
};

/**
 * 新增用户
 * @param params 用户信息
 * @returns 创建的用户
 */
export const createUser = (
  params: CreateUserParams,
): Promise<ApiResponse<User>> => {
  return http.post("/user", params).then((res) => res.data);
};

/**
 * 编辑用户
 * @param params 用户信息（含 id）
 * @returns 更新后的用户
 */
export const updateUser = (
  params: UpdateUserParams,
): Promise<ApiResponse<User>> => {
  const { id, ...data } = params;
  return http.put(`/user/${id}`, data).then((res) => res.data);
};

/**
 * 删除用户
 * @param id 用户 ID
 * @returns void
 */
export const deleteUser = (id: number): Promise<ApiResponse<null>> => {
  return http.delete(`/user/${id}`).then((res) => res.data);
};
