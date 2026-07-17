import { Router, type Request, type Response } from 'express';
import type { ApiResponse, PaginatedData, User } from '../types.ts';
import { generateMockUsers } from '../mock/users.ts';

const router = Router();

/** 内存中的 mock 数据，服务启动时生成一次 */
const ALL_USERS: User[] = generateMockUsers();

/**
 * GET /api/user/list
 * 分页查询用户列表，支持关键词搜索和排序
 *
 * Query 参数:
 *   page      - 页码（默认 1）
 *   pageSize  - 每页条数（默认 10）
 *   keyword   - 搜索关键词（匹配 username / email）
 *   sortField - 排序字段
 *   sortOrder - 排序方向（asc / desc）
 */
router.get('/user/list', (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 10));
  const keyword = (req.query.keyword as string)?.trim();
  const sortField = req.query.sortField as string | undefined;
  const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

  // 1. 关键词筛选
  let filtered = keyword
    ? ALL_USERS.filter(
        (u) => u.username.includes(keyword) || u.email.toLowerCase().includes(keyword.toLowerCase()),
      )
    : [...ALL_USERS];

  // 2. 排序
  if (sortField && (sortField === 'id' || sortField === 'createdAt' || sortField === 'username')) {
    const dir = sortOrder === 'desc' ? -1 : 1;
    filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal) * dir;
      }
      return ((aVal as number) - (bVal as number)) * dir;
    });
  }

  // 3. 分页
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const list = filtered.slice(start, start + pageSize);

  const body: ApiResponse<PaginatedData<User>> = {
    code: 0,
    message: 'success',
    data: { list, total, page, pageSize },
  };

  // 模拟网络延迟
  setTimeout(() => res.json(body), 300);
});

export default router;
