import axios from 'axios';
import { tokenStore } from './store';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
export const api = axios.create({ baseURL: API_URL });

// 请求拦截器 - 自动添加 Authorization header
api.interceptors.request.use(
    (config) => {
        const token = tokenStore.token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 响应拦截器 - 处理 401 错误
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // 只处理 401 错误
        if (error.response?.status === 401) {
            const url = error.config?.url || '';

            // 排除登录和注册接口（这些接口 401 是正常的）
            if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
                console.warn('401 Unauthorized - Token 可能已过期');

                // 清除 token
                tokenStore.token = null;

                // 只有在非登录页面才跳转
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            }
        }

        return Promise.reject(error);
    }
);