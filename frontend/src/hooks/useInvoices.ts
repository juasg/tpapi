import { useQuery } from '@tanstack/react-query';
import { invoicesApi } from '../api/invoices';
import type { QueryParams } from '../types';

export function useInvoices(params?: QueryParams) {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: () => invoicesApi.list(params),
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: () => invoicesApi.get(id),
    enabled: !!id,
  });
}
