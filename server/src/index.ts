import express from 'express';
import cors from 'cors';
import userRouter from './routes/user.ts';

const app = express();
const PORT = 3000;

// ---------- 中间件 ----------
app.use(cors());
app.use(express.json());

// ---------- 路由 ----------
app.use('/api', userRouter);

// ---------- 启动 ----------
app.listen(PORT, () => {
  console.log(`[server] Mock API 已启动 → http://localhost:${PORT}`);
  console.log(`[server] GET /api/user/list`);
});
