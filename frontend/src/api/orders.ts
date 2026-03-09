import { get, post } from './client';
import type { Order, CreateOrderRequest, PaginatedResponse, QueryParams } from '../types';

export const ordersApi = {
  list: (params?: QueryParams) =>
    get<PaginatedResponse<Order>>('/orders', { params }),

  get: (id: string) =>
    get<Order>(`/orders/${id}`),

  create: (body: CreateOrderRequest) =>
    post<Order>('/orders', body),

  getStatus: (id: string) =>
    get<Pick<Order, 'id' | 'status' | 'updatedAt'>>(`/orders/${id}/status`),
};
