export type WhatsAppStatusState = 'connected' | 'unconfigured' | 'error';

export interface WhatsAppStatusResponse {
  status: WhatsAppStatusState;
  configured: boolean;
  phoneNumberId?: string | null;
  webhookPath: string;
  message: string;
  lastReceivedAt?: string | null;
  serverTime: string;
}
