import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../api/orders';
import type { CreateOrderRequest, QueryParams } from '../types';

export function useOrders(params?: QueryParams) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => ordersApi.list(params),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => ordersApi.get(id),
    enabled: !!id,
  });
}

export function useOrderStatus(id: string) {
  return useQuery({
    queryKey: ['orders', id, 'status'],
    queryFn: () => ordersApi.getStatus(id),
    enabled: !!id,
    refetchInterval: 30_000,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateOrderRequest) => ordersApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}
