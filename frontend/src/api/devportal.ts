import { get } from './client';
import type { ApiProduct } from '../types';

export const devPortalApi = {
  listProducts: () =>
    get<ApiProduct[]>('/developer/products'),

  getProduct: (id: string) =>
    get<ApiProduct>(`/developer/products/${id}`),
};
