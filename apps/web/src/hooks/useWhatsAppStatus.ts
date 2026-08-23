import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../lib/api';
import { WhatsAppStatusResponse } from '@khatagenie/types';

export function useWhatsAppStatus() {
  return useQuery<WhatsAppStatusResponse>({
    queryKey: ['whatsapp', 'status'],
    queryFn: async () => {
      try {
        return await fetchApi<WhatsAppStatusResponse>('/whatsapp/status');
      } catch {
        return {
          status: 'unconfigured',
          configured: false,
          webhookPath: '/api/v1/whatsapp/webhook',
          message: 'Unable to reach WhatsApp status probe',
          serverTime: new Date().toISOString(),
        };
      }
    },
    refetchInterval: 30000,
    staleTime: 15000,
  });
}
