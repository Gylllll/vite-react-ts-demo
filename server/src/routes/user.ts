import { Router, type Request, type Response } from 'express';
import type { ApiResponse, PaginatedData, User } from '../types.ts';
import { generateMockUsers } from '../mock/users.ts';

const router = Router();

/** 内存中的 mock 数据，服务启动时生成一次 */
const ALL_USERS: User[] = generateMockUsers();

/** 自增 ID 计数器 */
let nextId = ALL_USERS.length + 1;

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

/**
 * POST /api/user
 * 新增用户
 *
 * Body 参数:
 *   username - 用户名（必填）
 *   email    - 邮箱（必填）
 *   role     - 角色（必填）
 *   status   - 状态（必填）
 */
router.post('/user', (req: Request, res: Response) => {
  const { username, email, role, status } = req.body;

  // 参数校验
  if (!username?.trim() || !email?.trim()) {
    const body: ApiResponse<null> = { code: 400, message: '用户名和邮箱不能为空', data: null };
    res.status(400).json(body);
    return;
  }

  if (!['admin', 'editor', 'viewer'].includes(role)) {
    const body: ApiResponse<null> = { code: 400, message: '无效的角色', data: null };
    res.status(400).json(body);
    return;
  }

  if (!['active', 'inactive', 'banned'].includes(status)) {
    const body: ApiResponse<null> = { code: 400, message: '无效的状态', data: null };
    res.status(400).json(body);
    return;
  }

  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const dateStr = `${y}-${m}-${d}`;

  const newUser: User = {
    id: nextId++,
    username: username.trim(),
    email: email.trim(),
    role,
    status,
    createdAt: dateStr,
    updatedAt: dateStr,
  };

  ALL_USERS.unshift(newUser);

  const body: ApiResponse<User> = { code: 0, message: 'success', data: newUser };
  setTimeout(() => res.json(body), 300);
});

/**
 * PUT /api/user/:id
 * 编辑用户
 *
 * Body 参数（均选填）:
 *   username - 用户名
 *   email    - 邮箱
 *   role     - 角色
 *   status   - 状态
 */
router.put('/user/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const user = ALL_USERS.find((u) => u.id === id);

  if (!user) {
    const body: ApiResponse<null> = { code: 404, message: '用户不存在', data: null };
    res.status(404).json(body);
    return;
  }

  const { username, email, role, status } = req.body;

  if (username !== undefined) {
    if (!String(username).trim()) {
      const body: ApiResponse<null> = { code: 400, message: '用户名不能为空', data: null };
      res.status(400).json(body);
      return;
    }
    user.username = String(username).trim();
  }

  if (email !== undefined) {
    if (!String(email).trim()) {
      const body: ApiResponse<null> = { code: 400, message: '邮箱不能为空', data: null };
      res.status(400).json(body);
      return;
    }
    user.email = String(email).trim();
  }

  if (role !== undefined) {
    if (!['admin', 'editor', 'viewer'].includes(role)) {
      const body: ApiResponse<null> = { code: 400, message: '无效的角色', data: null };
      res.status(400).json(body);
      return;
    }
    user.role = role;
  }

  if (status !== undefined) {
    if (!['active', 'inactive', 'banned'].includes(status)) {
      const body: ApiResponse<null> = { code: 400, message: '无效的状态', data: null };
      res.status(400).json(body);
      return;
    }
    user.status = status;
  }

  // 更新时间
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  user.updatedAt = `${y}-${m}-${d}`;

  const body: ApiResponse<User> = { code: 0, message: 'success', data: user };
  setTimeout(() => res.json(body), 300);
});

/**
 * DELETE /api/user/:id
 * 删除用户
 */
router.delete('/user/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const idx = ALL_USERS.findIndex((u) => u.id === id);

  if (idx === -1) {
    const body: ApiResponse<null> = { code: 404, message: '用户不存在', data: null };
    res.status(404).json(body);
    return;
  }

  ALL_USERS.splice(idx, 1);

  const body: ApiResponse<null> = { code: 0, message: 'success', data: null };
  setTimeout(() => res.json(body), 300);
});

export default router;
