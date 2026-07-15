/** 标准 API 响应体 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/** 分页请求参数 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/** 分页响应数据 */
export interface PaginatedData<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** 分页 API 响应（完整） */
export type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>;

/** 列表查询通用参数（分页 + 可选排序） */
export interface ListQueryParams extends PaginationParams {
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}
