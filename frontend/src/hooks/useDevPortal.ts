import { useQuery } from '@tanstack/react-query';
import { devPortalApi } from '../api/devportal';

export function useApiProducts() {
  return useQuery({
    queryKey: ['dev-products'],
    queryFn: () => devPortalApi.listProducts(),
    staleTime: 10 * 60_000,
  });
}

export function useApiProduct(id: string) {
  return useQuery({
    queryKey: ['dev-products', id],
    queryFn: () => devPortalApi.getProduct(id),
    enabled: !!id,
    staleTime: 10 * 60_000,
  });
}
