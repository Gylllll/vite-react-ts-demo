import { Outlet } from 'react-router-dom';

/**
 * 根布局组件 —— 所有子路由通过 <Outlet /> 渲染
 */
const App: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Outlet />
    </div>
  );
};

export default App;
