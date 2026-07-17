import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PaginatedResponse, PaginatedData } from '../../types/common.ts';
import type { User } from '../../types/user.ts';
import UserListPage from '../UserListPage.tsx';

// ---------------------------------------------------------------------------
// hoisted mock functions (usable inside vi.mock factory)
// ---------------------------------------------------------------------------
const { mockGetUserList, mockCreateUser, mockUpdateUser, mockDeleteUser } = vi.hoisted(() => ({
  mockGetUserList: vi.fn(),
  mockCreateUser: vi.fn(),
  mockUpdateUser: vi.fn(),
  mockDeleteUser: vi.fn(),
}));

vi.mock('../../api/user', () => ({
  getUserList: mockGetUserList,
  createUser: mockCreateUser,
  updateUser: mockUpdateUser,
  deleteUser: mockDeleteUser,
}));

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function makeUser(overrides: Partial<User> = {}): User {
  const id = overrides.id ?? 1;
  return {
    id,
    username: `user_${id}`,
    email: `user_${id}@example.com`,
    role: 'viewer',
    status: 'active',
    createdAt: '2025-06-01T08:00:00Z',
    updatedAt: '2025-06-10T08:00:00Z',
    ...overrides,
  };
}

function makeResponse(
  list: User[],
  total: number,
  page = 1,
  pageSize = 10,
): PaginatedResponse<User> {
  return {
    code: 0,
    message: 'ok',
    data: { list, total, page, pageSize },
  };
}

// ---------------------------------------------------------------------------
// UserListPage — 搜索逻辑
// ---------------------------------------------------------------------------
describe('UserListPage — 搜索逻辑', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    vi.resetAllMocks();
    user = userEvent.setup();
  });

  afterEach(() => {
    cleanup();
  });

  describe('初始加载', () => {
    it('挂载时以默认 page=1, keyword=undefined 拉取数据', async () => {
      const users = Array.from({ length: 10 }, (_, i) => makeUser({ id: i + 1 }));
      mockGetUserList.mockResolvedValueOnce(makeResponse(users, 25));

      render(<UserListPage />);

      await waitFor(() => {
        expect(mockGetUserList).toHaveBeenCalledTimes(1);
      });

      expect(mockGetUserList).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        keyword: undefined,
      });

      // 数据已渲染到表格
      expect(screen.getByText('user_1')).toBeInTheDocument();
      expect(screen.getByText('user_10@example.com')).toBeInTheDocument();
    });

    it('挂载时展示 10 条用户数据', async () => {
      const users = Array.from({ length: 10 }, (_, i) => makeUser({ id: i + 1 }));
      mockGetUserList.mockResolvedValueOnce(makeResponse(users, 10));

      render(<UserListPage />);

      await waitFor(() => {
        expect(screen.getByText('user_1')).toBeInTheDocument();
      });

      for (let i = 1; i <= 10; i++) {
        expect(screen.getByText(`user_${i}`)).toBeInTheDocument();
      }
    });
  });

  describe('关键字输入与搜索', () => {
    it('输入关键字并点击搜索按钮 → 以 keyword 和 page=1 请求', async () => {
      const emptyUsers: User[] = [];
      // 第一次：初始加载
      mockGetUserList.mockResolvedValueOnce(makeResponse(emptyUsers, 0));
      // 第二次：搜索
      mockGetUserList.mockResolvedValueOnce(makeResponse(emptyUsers, 0));

      render(<UserListPage />);

      await waitFor(() => {
        expect(mockGetUserList).toHaveBeenCalledTimes(1);
      });

      const input = screen.getByPlaceholderText('搜索用户名或邮箱');
      const searchBtn = screen.getByRole('button', { name: '搜索' });

      await user.type(input, 'alice');
      await user.click(searchBtn);

      await waitFor(() => {
        expect(mockGetUserList).toHaveBeenCalledTimes(2);
      });

      expect(mockGetUserList).toHaveBeenLastCalledWith({
        page: 1,
        pageSize: 10,
        keyword: 'alice',
      });
    });

    it('按 Enter 触发搜索', async () => {
      mockGetUserList.mockResolvedValueOnce(makeResponse([], 0));
      mockGetUserList.mockResolvedValueOnce(makeResponse([], 0));

      render(<UserListPage />);

      await waitFor(() => {
        expect(mockGetUserList).toHaveBeenCalledTimes(1);
      });

      const input = screen.getByPlaceholderText('搜索用户名或邮箱');
      await user.type(input, 'bob');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockGetUserList).toHaveBeenCalledTimes(2);
      });

      expect(mockGetUserList).toHaveBeenLastCalledWith({
        page: 1,
        pageSize: 10,
        keyword: 'bob',
      });
    });

    it('搜索后 page 重置为 1（当前在第 3 页时搜索）', async () => {
      const usersPage1 = Array.from({ length: 10 }, (_, i) => makeUser({ id: i + 1 }));
      const usersPage3 = Array.from({ length: 5 }, (_, i) => makeUser({ id: i + 21 }));

      // 初始加载 → 25 条数据, 3 页
      mockGetUserList.mockResolvedValueOnce(makeResponse(usersPage1, 25));
      // 点击第 3 页
      mockGetUserList.mockResolvedValueOnce(makeResponse(usersPage3, 25, 3));
      // 搜索
      mockGetUserList.mockResolvedValueOnce(makeResponse([], 0));

      render(<UserListPage />);

      await waitFor(() => {
        expect(screen.getByText('user_1')).toBeInTheDocument();
      });

      // 翻到第 3 页
      const page3Btn = screen.getByRole('button', { name: '3' });
      await user.click(page3Btn);

      await waitFor(() => {
        expect(mockGetUserList).toHaveBeenCalledTimes(2);
      });
      expect(mockGetUserList).toHaveBeenLastCalledWith({
        page: 3,
        pageSize: 10,
        keyword: undefined,
      });

      // 输入关键字搜索
      const input = screen.getByPlaceholderText('搜索用户名或邮箱');
      const searchBtn = screen.getByRole('button', { name: '搜索' });
      await user.type(input, 'charlie');
      await user.click(searchBtn);

      await waitFor(() => {
        expect(mockGetUserList).toHaveBeenCalledTimes(3);
      });

      // 第三次调用 page 应重置为 1，且携带 keyword
      expect(mockGetUserList).toHaveBeenLastCalledWith({
        page: 1,
        pageSize: 10,
        keyword: 'charlie',
      });
    });

    it('输入仅含空格的 keyword 时，trim 后 searchKeyword 不变 → 不触发多余请求', async () => {
      const users = Array.from({ length: 10 }, (_, i) => makeUser({ id: i + 1 }));
      mockGetUserList.mockResolvedValueOnce(makeResponse(users, 10));

      render(<UserListPage />);

      await waitFor(() => {
        expect(screen.getByText('user_1')).toBeInTheDocument();
      });
      expect(mockGetUserList).toHaveBeenCalledTimes(1);

      const input = screen.getByPlaceholderText('搜索用户名或邮箱');
      const searchBtn = screen.getByRole('button', { name: '搜索' });

      // 输入空格后点击搜索
      await user.type(input, '   ');
      await user.click(searchBtn);

      // searchKeyword 未变化（'' → ''），不会触发额外请求
      expect(mockGetUserList).toHaveBeenCalledTimes(1);

      // 搜索输入框的值保留了用户的原始输入（keyword 状态）
      expect(input).toHaveValue('   ');
    });
  });

  describe('搜索按钮禁用状态', () => {
    it('loading 时搜索按钮 disabled', async () => {
      // 让第一次请求永远不结束
      let resolvePromise!: (value: PaginatedResponse<User>) => void;
      const pending = new Promise<PaginatedResponse<User>>((res) => {
        resolvePromise = res;
      });
      mockGetUserList.mockReturnValueOnce(pending);

      render(<UserListPage />);

      const searchBtn = screen.getByRole('button', { name: '搜索' });
      expect(searchBtn).toBeDisabled();

      // 结束请求
      resolvePromise(makeResponse([], 0));

      await waitFor(() => {
        expect(searchBtn).not.toBeDisabled();
      });
    });
  });

  describe('清除搜索', () => {
    it('搜索无结果时显示"清除搜索"按钮，点击后重置', async () => {
      mockGetUserList.mockResolvedValueOnce(makeResponse([], 0)); // 初始
      mockGetUserList.mockResolvedValueOnce(makeResponse([], 0)); // 搜索
      mockGetUserList.mockResolvedValueOnce(makeResponse([], 0)); // 清除后

      render(<UserListPage />);

      await waitFor(() => {
        expect(mockGetUserList).toHaveBeenCalledTimes(1);
      });

      // 搜索
      const input = screen.getByPlaceholderText('搜索用户名或邮箱');
      const searchBtn = screen.getByRole('button', { name: '搜索' });
      await user.type(input, 'nonexistent');
      await user.click(searchBtn);

      // 搜索无结果时出现"清除搜索"按钮
      await waitFor(() => {
        expect(screen.getByText('清除搜索')).toBeInTheDocument();
      });

      // 点击清除
      await user.click(screen.getByText('清除搜索'));

      await waitFor(() => {
        expect(mockGetUserList).toHaveBeenCalledTimes(3);
      });

      // 清除后 keyword 为 undefined，page 为 1
      expect(mockGetUserList).toHaveBeenLastCalledWith({
        page: 1,
        pageSize: 10,
        keyword: undefined,
      });

      // 搜索输入框已清空
      expect(input).toHaveValue('');
    });
  });

  describe('API 报错处理', () => {
    it('接口报错时设置 error，Table 显示错误信息', async () => {
      mockGetUserList.mockRejectedValueOnce(new Error('网络异常'));

      render(<UserListPage />);

      await waitFor(() => {
        expect(screen.getByText('网络异常')).toBeInTheDocument();
      });

      // 应出现"重新加载"按钮
      expect(screen.getByText('重新加载')).toBeInTheDocument();
    });

    it('点击"重新加载"按钮触发重试', async () => {
      mockGetUserList.mockRejectedValueOnce(new Error('请求失败'));
      const users = [makeUser({ id: 1 })];
      mockGetUserList.mockResolvedValueOnce(makeResponse(users, 1));

      render(<UserListPage />);

      await waitFor(() => {
        expect(screen.getByText('重新加载')).toBeInTheDocument();
      });

      await user.click(screen.getByText('重新加载'));

      await waitFor(() => {
        expect(mockGetUserList).toHaveBeenCalledTimes(2);
      });

      // 第二次调用同样使用原参数
      expect(mockGetUserList).toHaveBeenLastCalledWith({
        page: 1,
        pageSize: 10,
        keyword: undefined,
      });

      // 数据渲染成功
      expect(screen.getByText('user_1')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// UserListPage — 分页逻辑
// ---------------------------------------------------------------------------
describe('UserListPage — 分页逻辑', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    vi.resetAllMocks();
    user = userEvent.setup();
  });

  afterEach(() => {
    cleanup();
  });

  describe('分页组件可见性', () => {
    it('data 为 null 时不显示分页（初始状态）', () => {
      // 请求永远 pending → data 一直为 null
      mockGetUserList.mockReturnValueOnce(new Promise(() => {}));

      render(<UserListPage />);

      // "第" 是分页组件特有的文本（"第 1-10 条 / 共 N 条"）
      expect(screen.queryByText(/第.*条/)).not.toBeInTheDocument();
    });

    it('total 为 0 时不显示分页', async () => {
      mockGetUserList.mockResolvedValueOnce(makeResponse([], 0));

      render(<UserListPage />);

      await waitFor(() => {
        expect(mockGetUserList).toHaveBeenCalledTimes(1);
      });

      expect(screen.queryByText(/第.*条/)).not.toBeInTheDocument();
    });

    it('total > 0 时显示分页', async () => {
      const users = Array.from({ length: 10 }, (_, i) => makeUser({ id: i + 1 }));
      mockGetUserList.mockResolvedValueOnce(makeResponse(users, 25));

      render(<UserListPage />);

      await waitFor(() => {
        expect(screen.getByText('user_1')).toBeInTheDocument();
      });

      // 第 1-10 条 / 共 25 条
      expect(screen.getByText(/第.*条/)).toBeInTheDocument();
    });

    it('数据跨多页时页码按钮正确渲染（共 25 条 → 3 页）', async () => {
      const users = Array.from({ length: 10 }, (_, i) => makeUser({ id: i + 1 }));
      mockGetUserList.mockResolvedValueOnce(makeResponse(users, 25));

      render(<UserListPage />);

      await waitFor(() => {
        expect(screen.getByText('user_1')).toBeInTheDocument();
      });

      // 应有页码 1, 2, 3
      expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
    });
  });

  describe('翻页交互', () => {
    it('点击页码 → 以目标页和保持的 searchKeyword 请求', async () => {
      const usersPage1 = Array.from({ length: 10 }, (_, i) => makeUser({ id: i + 1 }));
      const usersPage2 = Array.from({ length: 10 }, (_, i) => makeUser({ id: i + 11 }));

      mockGetUserList.mockResolvedValueOnce(makeResponse(usersPage1, 25));
      mockGetUserList.mockResolvedValueOnce(makeResponse(usersPage2, 25, 2));

      render(<UserListPage />);

      await waitFor(() => {
        expect(screen.getByText('user_1')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: '2' }));

      await waitFor(() => {
        expect(mockGetUserList).toHaveBeenCalledTimes(2);
      });

      expect(mockGetUserList).toHaveBeenLastCalledWith({
        page: 2,
        pageSize: 10,
        keyword: undefined,
      });
    });

    it('连续翻页 1→2→3 每次携带正确的 page 参数', async () => {
      const p1 = Array.from({ length: 10 }, (_, i) => makeUser({ id: i + 1 }));
      const p2 = Array.from({ length: 10 }, (_, i) => makeUser({ id: i + 11 }));
      const p3 = Array.from({ length: 5 }, (_, i) => makeUser({ id: i + 21 }));

      mockGetUserList
        .mockResolvedValueOnce(makeResponse(p1, 25))
        .mockResolvedValueOnce(makeResponse(p2, 25, 2))
        .mockResolvedValueOnce(makeResponse(p3, 25, 3));

      render(<UserListPage />);

      await waitFor(() => {
        expect(screen.getByText('user_1')).toBeInTheDocument();
      });

      // 翻到第 2 页
      await user.click(screen.getByRole('button', { name: '2' }));
      await waitFor(() => {
        expect(mockGetUserList).toHaveBeenCalledTimes(2);
      });

      // 翻到第 3 页
      await user.click(screen.getByRole('button', { name: '3' }));
      await waitFor(() => {
        expect(mockGetUserList).toHaveBeenCalledTimes(3);
      });

      const calls = mockGetUserList.mock.calls;
      expect(calls[0][0]).toEqual({ page: 1, pageSize: 10, keyword: undefined });
      expect(calls[1][0]).toEqual({ page: 2, pageSize: 10, keyword: undefined });
      expect(calls[2][0]).toEqual({ page: 3, pageSize: 10, keyword: undefined });
    });

    it('搜索后再翻页 → keyword 保持', async () => {
      const emptyUsers: User[] = [];
      const searchResultsPage2: User[] = [
        makeUser({ id: 50, username: 'match50' }),
        makeUser({ id: 51, username: 'match51' }),
      ];

      mockGetUserList.mockResolvedValueOnce(makeResponse(emptyUsers, 0)); // 初始
      mockGetUserList.mockResolvedValueOnce(
        makeResponse(
          Array.from({ length: 10 }, (_, i) => makeUser({ id: i + 10, username: `match${i + 10}` })),
          25,
          1,
        ),
      ); // 搜索第一页
      mockGetUserList.mockResolvedValueOnce(makeResponse(searchResultsPage2, 25, 2)); // 搜索第二页

      render(<UserListPage />);

      await waitFor(() => {
        expect(mockGetUserList).toHaveBeenCalledTimes(1);
      });

      // 搜索
      const input = screen.getByPlaceholderText('搜索用户名或邮箱');
      await user.type(input, 'match');
      await user.click(screen.getByRole('button', { name: '搜索' }));

      await waitFor(() => {
        expect(mockGetUserList).toHaveBeenCalledTimes(2);
      });
      expect(mockGetUserList).toHaveBeenLastCalledWith({
        page: 1,
        pageSize: 10,
        keyword: 'match',
      });

      // 翻到第 2 页
      await user.click(screen.getByRole('button', { name: '2' }));

      await waitFor(() => {
        expect(mockGetUserList).toHaveBeenCalledTimes(3);
      });

      // keyword 保持为 'match'
      expect(mockGetUserList).toHaveBeenLastCalledWith({
        page: 2,
        pageSize: 10,
        keyword: 'match',
      });
    });
  });

  describe('分页信息展示', () => {
    it('第 1 页展示"第 1-10 条 / 共 25 条"', async () => {
      const users = Array.from({ length: 10 }, (_, i) => makeUser({ id: i + 1 }));
      mockGetUserList.mockResolvedValueOnce(makeResponse(users, 25));

      render(<UserListPage />);

      await waitFor(() => {
        expect(screen.getByText(/第 1-10 条 \/ 共 25 条/)).toBeInTheDocument();
      });
    });

    it('最后一页不足 pageSize 条时展示正确范围', async () => {
      const usersPage1 = Array.from({ length: 10 }, (_, i) => makeUser({ id: i + 1 }));
      const usersPage3 = Array.from({ length: 5 }, (_, i) => makeUser({ id: i + 21 }));

      // 初始加载 → 25 条数据, 3 页
      mockGetUserList.mockResolvedValueOnce(makeResponse(usersPage1, 25));
      // 点击第 3 页
      mockGetUserList.mockResolvedValueOnce(makeResponse(usersPage3, 25, 3));

      render(<UserListPage />);

      await waitFor(() => {
        expect(screen.getByText('user_1')).toBeInTheDocument();
      });

      // 点击页码 3
      await user.click(screen.getByRole('button', { name: '3' }));

      // 等待新数据渲染 + 分页信息更新
      await waitFor(() => {
        expect(screen.getByText('user_21')).toBeInTheDocument();
      });

      // 组件内部 page 状态已更新为 3，分页展示"第 21-25 条 / 共 25 条"
      expect(screen.getByText(/第 21-25 条 \/ 共 25 条/)).toBeInTheDocument();
    });

    it('仅 1 条数据时展示"第 1-1 条 / 共 1 条"', async () => {
      mockGetUserList.mockResolvedValueOnce(makeResponse([makeUser({ id: 1 })], 1));

      render(<UserListPage />);

      await waitFor(() => {
        expect(screen.getByText('user_1')).toBeInTheDocument();
      });

      expect(screen.getByText(/第 1-1 条 \/ 共 1 条/)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// 组合场景: 搜索 + 分页联动
// ---------------------------------------------------------------------------
describe('UserListPage — 搜索 + 分页联动', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    vi.resetAllMocks();
    user = userEvent.setup();
  });

  afterEach(() => {
    cleanup();
  });

  it('搜索 → 翻页 → 重新搜索 → 翻页（完整流程）', async () => {
    // --- Round 1: 初始加载 ---
    const initial = Array.from({ length: 10 }, (_, i) => makeUser({ id: i + 1 }));
    mockGetUserList.mockResolvedValueOnce(makeResponse(initial, 30));

    render(<UserListPage />);
    await waitFor(() => {
      expect(screen.getByText('user_1')).toBeInTheDocument();
    });
    expect(mockGetUserList).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 10,
      keyword: undefined,
    });

    // --- Round 2: 搜索 'dev' ---
    const searchResults = Array.from({ length: 10 }, (_, i) =>
      makeUser({ id: i + 100, username: `dev_${i}` }),
    );
    mockGetUserList.mockResolvedValueOnce(makeResponse(searchResults, 22));

    const input = screen.getByPlaceholderText('搜索用户名或邮箱');
    await user.type(input, 'dev');
    await user.click(screen.getByRole('button', { name: '搜索' }));

    await waitFor(() => {
      expect(screen.getByText('dev_0')).toBeInTheDocument();
    });
    expect(mockGetUserList).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 10,
      keyword: 'dev',
    });

    // --- Round 3: 翻到第 2 页（keyword 保持 'dev'）---
    const searchPage2 = Array.from({ length: 10 }, (_, i) =>
      makeUser({ id: i + 200, username: `dev_p2_${i}` }),
    );
    mockGetUserList.mockResolvedValueOnce(makeResponse(searchPage2, 22, 2));

    await user.click(screen.getByRole('button', { name: '2' }));

    await waitFor(() => {
      expect(screen.getByText('dev_p2_0')).toBeInTheDocument();
    });
    expect(mockGetUserList).toHaveBeenLastCalledWith({
      page: 2,
      pageSize: 10,
      keyword: 'dev',
    });

    // --- Round 4: 搜索 'ops'（新 keyword，page 重置为 1）---
    const opsResults = Array.from({ length: 3 }, (_, i) =>
      makeUser({ id: i + 300, username: `ops_${i}` }),
    );
    mockGetUserList.mockResolvedValueOnce(makeResponse(opsResults, 3));

    // 清空旧 keyword 并输入新的
    await user.clear(input);
    await user.type(input, 'ops');
    await user.click(screen.getByRole('button', { name: '搜索' }));

    await waitFor(() => {
      expect(screen.getByText('ops_0')).toBeInTheDocument();
    });
    // page 重置为 1，keyword 为 'ops'
    expect(mockGetUserList).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 10,
      keyword: 'ops',
    });

    // 共 3 条 → 仅 1 页，无分页
    expect(screen.queryByRole('button', { name: '2' })).not.toBeInTheDocument();
  });
});
