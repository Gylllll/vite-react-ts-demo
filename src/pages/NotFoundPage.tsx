import { useNavigate } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8">
      <h1 className="text-6xl font-bold text-gray-300">404</h1>
      <p className="mt-4 text-gray-500">页面不存在</p>
      <button
        type="button"
        className="mt-6 rounded bg-purple-500 px-4 py-2 text-white hover:bg-purple-600 transition-colors cursor-pointer"
        onClick={() => navigate('/', { replace: true })}
      >
        返回首页
      </button>
    </main>
  );
};

export default NotFoundPage;
