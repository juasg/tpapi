import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../api/products';
import type { QueryParams } from '../types';

export function useProducts(params?: QueryParams) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productsApi.list(params),
    staleTime: 5 * 60_000,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => productsApi.get(id),
    enabled: !!id,
    staleTime: 5 * 60_000,
  });
}
