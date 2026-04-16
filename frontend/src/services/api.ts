import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const api = {
    get: async <T>(url: string): Promise<T> => {
        const response = await axiosInstance.get<T>(url);
        return response.data;
    },

    post: async <T>(url: string, data: any): Promise<T> => {
        const response = await axiosInstance.post<T>(url, data);
        return response.data;
    },

    put: async <T>(url: string, data: any): Promise<T> => {
        const response = await axiosInstance.put<T>(url, data);
        return response.data;
    },

    patch: async <T>(url: string, data: any): Promise<T> => {
        const response = await axiosInstance.patch<T>(url, data);
        return response.data;
    },

    delete: async <T>(url: string): Promise<T> => {
        const response = await axiosInstance.delete<T>(url);
        return response.data;
    },
};
