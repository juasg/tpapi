import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminGet, adminPatch } from '../api/adminClient';
import type { ApiKey } from '../types';

export interface AdminStats {
  customers:            number;
  orders:               number;
  pendingRegistrations: number;
  pendingApiKeys:       number;
  activeApiKeys:        number;
}

export interface AdminOrder {
  id:           string;
  orderNumber:  string;
  customerId:   string;
  createdAt:    string;
  totalAmount:  number;
  currency:     string;
  deliveryDate: string | null;
  itemCount:    number;
  status:       string;
}

export interface AdminCustomer {
  id:          string;
  companyName: string;
  address:     string;
  city:        string;
  country:     string;
  phone:       string;
  email:       string;
  taxId:       string;
}

export interface Registration {
  id:          string;
  companyName: string;
  email:       string;
  phone:       string;
  address:     string;
  city:        string;
  country:     string;
  taxId:       string;
  status:      'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  reviewedAt:  string | null;
  reviewNote:  string | null;
  clientId?:   string;
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn:  () => adminGet<AdminStats>('/admin/stats'),
    refetchInterval: 15_000,
  });
}

export function useAdminOrders(params?: { status?: string; customerId?: string }) {
  return useQuery({
    queryKey: ['admin-orders', params],
    queryFn:  () => adminGet<{ data: AdminOrder[]; total: number }>('/admin/orders', { params }),
    staleTime: 30_000,
  });
}

export function useAdminCustomers() {
  return useQuery({
    queryKey: ['admin-customers'],
    queryFn:  () => adminGet<AdminCustomer[]>('/admin/customers'),
    staleTime: 60_000,
  });
}

export function useAdminRegistrations() {
  return useQuery({
    queryKey: ['admin-registrations'],
    queryFn:  () => adminGet<Registration[]>('/customers/admin/registrations'),
    refetchInterval: 10_000,
  });
}

export function useAdminApproveRegistration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      adminPatch<{ registration: Registration; credentials: object }>(
        `/customers/admin/registrations/${id}/approve`,
        { note },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-registrations'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
}

export function useAdminRejectRegistration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      adminPatch<Registration>(`/customers/admin/registrations/${id}/reject`, { note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-registrations'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
}

// Re-export API key admin hooks (centralised here)
export function useAdminApiKeys() {
  return useQuery({
    queryKey: ['admin-api-keys'],
    queryFn:  () => adminGet<ApiKey[]>('/developer/api-keys/admin/all'),
    refetchInterval: 10_000,
  });
}

export function useAdminApproveApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      adminPatch<ApiKey>(`/developer/api-keys/admin/${id}/approve`, { note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-api-keys'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
}

export function useAdminRejectApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      adminPatch<ApiKey>(`/developer/api-keys/admin/${id}/reject`, { note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-api-keys'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
}
