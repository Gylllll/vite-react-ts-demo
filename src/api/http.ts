import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '../types/common.ts';
import { loadingManager } from '../utils/loading.ts';

/** 业务错误码映射为可读信息 */
const BUSINESS_ERROR_MAP: Record<number, string> = {
  400: '请求参数错误',
  401: '登录已过期，请重新登录',
  403: '没有访问权限',
  404: '请求的资源不存在',
  500: '服务器内部错误',
  502: '网关错误',
  503: '服务暂不可用',
};

const http = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ---------- 请求拦截器 ----------
http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    loadingManager.show();
    // 可在此注入 token
    // const token = getToken();
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error: AxiosError) => {
    loadingManager.hide();
    return Promise.reject(error);
  },
);

// ---------- 响应拦截器 ----------
http.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResponse<unknown>;

    // 业务错误（code !== 0 或 200 均视业务约定调整）
    if (body.code !== 0 && body.code !== 200) {
      console.error(`[API Error] ${body.code}: ${body.message}`);
      loadingManager.hide();
      return Promise.reject(new Error(body.message || '接口异常'));
    }

    loadingManager.hide();
    return response;
  },
  (error: AxiosError) => {
    loadingManager.hide();
    const status = error.response?.status;

    if (status) {
      const msg = BUSINESS_ERROR_MAP[status] ?? `请求失败（${status}）`;
      console.error(`[HTTP ${status}] ${msg}`);

      // 401 可在此触发登出
      // if (status === 401) { clearToken(); window.location.href = '/login'; }
    } else if (error.code === 'ECONNABORTED') {
      console.error('[Network] 请求超时');
    } else {
      console.error('[Network] 网络异常，请检查连接');
    }

    return Promise.reject(error);
  },
);

export default http;
