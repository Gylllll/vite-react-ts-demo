const HomePage: React.FC = () => {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-gray-800">欢迎</h1>
      <p className="mt-4 text-gray-500">Vite + React + TypeScript + Zustand + Tailwind CSS + React Router</p>
      {/* 点击进入用户列表页 */}
      <a
        href="/user/list"
        className="mt-6 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
      >
        进入用户列表页
      </a>
    </main>
  );
};

export default HomePage;
