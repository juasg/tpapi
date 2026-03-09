import { useQuery } from '@tanstack/react-query';
import { shipmentsApi } from '../api/shipments';

export function useShipment(orderId: string) {
  return useQuery({
    queryKey: ['shipments', orderId],
    queryFn: () => shipmentsApi.getByOrder(orderId),
    enabled: !!orderId,
    refetchInterval: 60_000,
  });
}
