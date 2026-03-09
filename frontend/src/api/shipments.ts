import { get } from './client';
import type { Shipment } from '../types';

export const shipmentsApi = {
  getByOrder: (orderId: string) =>
    get<Shipment>(`/shipments/${orderId}`),
};
