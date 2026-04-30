import { apiClient } from '../lib/api';
import type {
  PWBUnit,
  PWBUnitListItem,
  PWBUnitCreatePayload,
  PWBUnitUpdatePayload,
  PaginatedResponse,
} from '../types/api';

export const pwbUnitsApi = {
  list: (page = 1, pageSize = 20) =>
    apiClient
      .get<PaginatedResponse<PWBUnitListItem>>('/pwbunits/', { params: { page, page_size: pageSize } })
      .then((r) => r.data),

  get: (unitName: string) =>
    apiClient.get<PWBUnit>(`/pwbunits/${unitName}/`).then((r) => r.data),

  create: (payload: PWBUnitCreatePayload) =>
    apiClient.post<PWBUnit>('/pwbunits/', payload).then((r) => r.data),

  update: (unitName: string, payload: PWBUnitUpdatePayload) =>
    apiClient.patch<PWBUnit>(`/pwbunits/${unitName}/`, payload).then((r) => r.data),

  delete: (unitName: string) =>
    apiClient.delete(`/pwbunits/${unitName}/`).then((r) => r.data),
};
