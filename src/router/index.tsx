import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from '../App.tsx';

const HomePage = lazy(() => import('../pages/HomePage.tsx'));
const UserListPage = lazy(() => import('../pages/UserListPage.tsx'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage.tsx'));

/** 路由加载时的 fallback */
const LoadingFallback: React.FC = () => (
  <div className="flex h-64 items-center justify-center text-gray-400">
    加载中...
  </div>
);

/**
 * 路由容器组件
 */
const RouterComp: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route element={<App />}>
            <Route index element={<HomePage />} />
            <Route path="user/list" element={<UserListPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default RouterComp;
