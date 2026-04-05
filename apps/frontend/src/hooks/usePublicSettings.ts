import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

/** Fetch non-secret app settings yang dapat diakses publik (tanpa auth) */
export function usePublicSettings() {
  return useQuery({
    queryKey: ['public-settings'],
    queryFn: () => api.get('/admin/settings/public').then(r => r.data.data as Record<string, string>),
    staleTime: 1000 * 60 * 10, // cache 10 menit
  });
}
