import { apiClient } from '../lib/api';
import type { AnalyticsData } from '../types/api';

export const analyticsApi = {
  track: (unitName: string, referrer = '') =>
    apiClient
      .post(`/pwbunits/${unitName}/track/`, { source: 'web', referrer })
      .catch(() => {}), // fire-and-forget, never block the page

  get: (unitName: string, period = 30) =>
    apiClient
      .get<AnalyticsData>(`/pwbunits/${unitName}/analytics/`, { params: { period } })
      .then((r) => r.data),
};
