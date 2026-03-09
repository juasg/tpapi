/**
 * Admin API client — attaches x-admin-secret header.
 * In production this would be a separate admin app with its own auth.
 */
import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';

const adminClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

adminClient.interceptors.request.use((config) => {
  const secret = sessionStorage.getItem('admin_secret');
  if (secret) config.headers['x-admin-secret'] = secret;
  return config;
});

export async function adminGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await adminClient.get<T>(url, config);
  return data;
}

export async function adminPatch<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await adminClient.patch<T>(url, body);
  return data;
}
