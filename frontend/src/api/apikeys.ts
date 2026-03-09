import { get, post, del, patch } from './client';
import type { ApiKey, ApiKeyRequest } from '../types';

export const apiKeysApi = {
  list: () =>
    get<ApiKey[]>('/developer/api-keys'),

  request: (body: ApiKeyRequest) =>
    post<ApiKey>('/developer/api-keys', body),

  revoke: (id: string) =>
    del<void>(`/developer/api-keys/${id}`),

  // Admin
  adminListAll: () =>
    get<ApiKey[]>('/developer/api-keys/admin/all'),

  adminApprove: (id: string, note?: string) =>
    patch<ApiKey>(`/developer/api-keys/admin/${id}/approve`, { note }),

  adminReject: (id: string, note?: string) =>
    patch<ApiKey>(`/developer/api-keys/admin/${id}/reject`, { note }),
};
