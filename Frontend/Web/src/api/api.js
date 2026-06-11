import axios from "axios";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "@/constants";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

// Request interceptor: Auto inject Access Token into request headers
api.interceptors.request.use((config) => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN);
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});

// Response interceptor: Auto renew Access Token if expired (401 Unauthorized)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/register');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem(REFRESH_TOKEN);
            if (!refreshToken) {
                localStorage.clear();
                window.location.href = "/login";
                return Promise.reject(error);
            }

            try {
                const res = await axios.post(
                    `${import.meta.env.VITE_API_URL}/auth/refresh/`,
                    { refresh: refreshToken }
                );

                localStorage.setItem(ACCESS_TOKEN, res.data.access);

                api.defaults.headers.Authorization = `Bearer ${res.data.access}`;
                return api(originalRequest);

            } catch (err) {
                localStorage.clear();
                window.location.href = "/login";
                return Promise.reject(err);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
