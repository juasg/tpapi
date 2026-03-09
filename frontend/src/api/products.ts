import { get } from './client';
import type { Product, PaginatedResponse, QueryParams } from '../types';

export const productsApi = {
  list: (params?: QueryParams) =>
    get<PaginatedResponse<Product>>('/products', { params }),

  get: (id: string) =>
    get<Product>(`/products/${id}`),
};
