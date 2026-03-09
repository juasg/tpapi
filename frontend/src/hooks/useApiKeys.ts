import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiKeysApi } from '../api/apikeys';
import { adminGet, adminPatch } from '../api/adminClient';
import type { ApiKey, ApiKeyRequest } from '../types';

export function useApiKeys() {
  return useQuery({
    queryKey: ['api-keys'],
    queryFn:  () => apiKeysApi.list(),
  });
}

export function useRequestApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ApiKeyRequest) => apiKeysApi.request(body),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  });
}

export function useRevokeApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiKeysApi.revoke(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  });
}

// ── Admin ──────────────────────────────────────────────────────────────────

export function useAdminApiKeys() {
  return useQuery({
    queryKey: ['admin-api-keys'],
    queryFn:  () => adminGet<ApiKey[]>('/developer/api-keys/admin/all'),
    refetchInterval: 10_000,
  });
}

export function useAdminApprove() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      adminPatch<ApiKey>(`/developer/api-keys/admin/${id}/approve`, { note }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-api-keys'] }),
  });
}

export function useAdminReject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      adminPatch<ApiKey>(`/developer/api-keys/admin/${id}/reject`, { note }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-api-keys'] }),
  });
}
