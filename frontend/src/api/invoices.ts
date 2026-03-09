import { get } from './client';
import type { Invoice, PaginatedResponse, QueryParams } from '../types';

export const invoicesApi = {
  list: (params?: QueryParams) =>
    get<PaginatedResponse<Invoice>>('/invoices', { params }),

  get: (id: string) =>
    get<Invoice>(`/invoices/${id}`),
};
