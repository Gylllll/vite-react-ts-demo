# 项目编码规范（强制）

## 1. React 组件规范

- 所有函数组件必须使用 `React.FC` 类型声明，搭配 Hooks 管理状态与副作用。
- **禁止在项目中使用 `any` 类型**，所有变量、参数、返回值必须有精确的 TS 类型标注。

```tsx
// ✅ 正确
const UserCard: React.FC<{ name: string; age: number }> = ({ name, age }) => {
  const [count, setCount] = useState<number>(0);
  return <div>{name}</div>;
};

// ❌ 错误
const UserCard = ({ name }: any) => { ... };
```

## 2. 样式规范

- **仅使用 Tailwind CSS** 编写样式，禁止创建 `.css` / `.scss` 文件（入口 `index.css` 除外）。
- 复杂复用样式使用 `@layer components` 在 `index.css` 中定义：

```css
@layer components {
  .card-panel {
    @apply rounded-lg border bg-white p-6 shadow-md;
  }
}
```

## 3. 文件与命名规范

- 页面组件命名：`XxxPage`（如 `HomePage`、`UserListPage`），文件放置在 `src/pages/` 下。
- 公共组件命名：`XxxComp`（如 `HeaderComp`、`ModalComp`），文件放置在 `src/components/` 下。
- **单文件不得超过 300 行**，超出必须拆分为子组件或独立模块。

## 4. API 请求与状态管理规范

- 所有 API 请求函数必须带 TS 泛型，明确请求参数与响应类型：

```ts
// api/user.ts
export const getUser = (id: string) =>
  axios.get<ApiResponse<User>>(`/api/users/${id}`);
```

- Zustand store **按业务领域拆分为独立 store**，禁止将所有状态集中在一个文件中：

```
src/store/
  userStore.ts    # 用户相关状态
  cartStore.ts    # 购物车相关状态
  appStore.ts     # 全局应用状态
```

## 5. 全局错误拦截规范

- 在 `src/api/` 中统一封装 axios 拦截器，全局处理接口错误（网络异常、HTTP 状态码、业务错误码）。
- 页面/组件层**不得**单独处理通用的接口错误（如 401、500），仅处理特定业务逻辑错误。

```ts
// api/http.ts
const http = axios.create({ baseURL: '/api' });

http.interceptors.response.use(
  (res) => res,
  (error) => {
    // 统一错误处理：toast 提示、登录过期跳转等
    return Promise.reject(error);
  }
);
```
