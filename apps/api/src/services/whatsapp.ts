import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma';
import { InvoiceStatus } from '@prisma/client';
import { extractionQueue } from './queue';
import { WhatsAppStatusResponse } from '@khatagenie/types';

export interface WhatsAppMediaMessage {
  from: string; // sender phone number (e.g. "919811000000")
  messageId: string;
  mediaId: string;
  mimeType: string;
  caption?: string;
}

export class WhatsAppService {
  private apiToken: string;
  private phoneNumberId: string;
  private appSecret: string;
  private uploadsDir: string;
  private lastWebhookEventAt: string | null = null;

  constructor() {
    this.apiToken = process.env.WHATSAPP_API_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.appSecret = process.env.WHATSAPP_APP_SECRET || '';
    this.uploadsDir = path.join(process.cwd(), 'uploads');

    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  public recordWebhookEvent(): void {
    this.lastWebhookEventAt = new Date().toISOString();
  }

  public getConnectionStatus(): WhatsAppStatusResponse {
    const apiToken = process.env.WHATSAPP_API_TOKEN || this.apiToken;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || this.phoneNumberId;

    const isConfigured = Boolean(apiToken && phoneNumberId);

    if (!isConfigured) {
      return {
        status: 'unconfigured',
        configured: false,
        phoneNumberId: phoneNumberId || null,
        webhookPath: '/api/v1/whatsapp/webhook',
        message: 'Meta WhatsApp Cloud API credentials not configured in .env',
        lastReceivedAt: this.lastWebhookEventAt,
        serverTime: new Date().toISOString(),
      };
    }

    return {
      status: 'connected',
      configured: true,
      phoneNumberId,
      webhookPath: '/api/v1/whatsapp/webhook',
      message: 'WhatsApp Cloud API webhook receiver is online and connected',
      lastReceivedAt: this.lastWebhookEventAt,
      serverTime: new Date().toISOString(),
    };
  }

  /**
   * Verifies SHA-256 signature from Meta webhook headers.
   */
  public verifySignature(rawBody: string, signatureHeader?: string): boolean {
    if (!this.appSecret) {
      // In development/test without appSecret, allow bypass; in production require secret
      return process.env.NODE_ENV !== 'production';
    }
    if (!signatureHeader) return false;
    try {
      const signature = signatureHeader.replace(/^sha256=/, '');
      const expectedSignature = crypto
        .createHmac('sha256', this.appSecret)
        .update(rawBody)
        .digest('hex');
      const sigBuf = Buffer.from(signature, 'hex');
      const expBuf = Buffer.from(expectedSignature, 'hex');
      return sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
    } catch {
      return false;
    }
  }

  /**
   * Downloads media binary from Meta Cloud API v19.0.
   */
  public async downloadMedia(mediaId: string): Promise<{ localPath: string; mimeType: string; size: number }> {
    if (!this.apiToken) {
      // Return placeholder file in dev mode with UUID
      const dummyFile = `wa_dev_${crypto.randomUUID()}.jpg`;
      const dummyPath = path.join(this.uploadsDir, dummyFile);
      if (!fs.existsSync(dummyPath)) {
        fs.writeFileSync(dummyPath, Buffer.from('mock-image-bytes'));
      }
      return { localPath: `/uploads/${dummyFile}`, mimeType: 'image/jpeg', size: 1024 };
    }

    // 1. Get media URL
    const metaUrl = `https://graph.facebook.com/v19.0/${mediaId}`;
    const metaRes = await fetch(metaUrl, {
      headers: { Authorization: `Bearer ${this.apiToken}` },
    });

    if (!metaRes.ok) {
      throw new Error(`Failed to fetch media metadata from Meta API: ${metaRes.statusText}`);
    }

    const metaData: any = await metaRes.json();
    const downloadUrl = metaData.url;
    const mimeType = metaData.mime_type || 'image/jpeg';

    // 2. Download media binary
    const fileRes = await fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${this.apiToken}` },
    });

    if (!fileRes.ok) {
      throw new Error(`Failed to download media binary from Meta CDN: ${fileRes.statusText}`);
    }

    const arrayBuffer = await fileRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = mimeType.includes('pdf') ? '.pdf' : '.jpg';
    const filename = `wa_${crypto.randomUUID()}${ext}`;
    const filePath = path.join(this.uploadsDir, filename);

    fs.writeFileSync(filePath, buffer);

    return {
      localPath: `/uploads/${filename}`,
      mimeType,
      size: buffer.length,
    };
  }

  /**
   * Sends text notification message back to sender via WhatsApp.
   */
  public async sendTextMessage(toPhone: string, text: string): Promise<boolean> {
    if (!this.apiToken || !this.phoneNumberId) {
      console.log(`[WhatsApp Mock Reply to +${toPhone}]: ${text}`);
      return true;
    }

    try {
      const url = `https://graph.facebook.com/v19.0/${this.phoneNumberId}/messages`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiToken}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: toPhone,
          type: 'text',
          text: { body: text },
        }),
      });
      return res.ok;
    } catch (err) {
      console.error(`Error sending WhatsApp reply:`, err);
      return false;
    }
  }

  /**
   * Processes incoming WhatsApp media message and delegates extraction to background queue.
   */
  public async processIncomingMedia(mediaMsg: WhatsAppMediaMessage): Promise<void> {
    console.log(`📥 Processing WhatsApp bill from +${mediaMsg.from} (Media: ${mediaMsg.mediaId})`);

    // 1. Look up client by sender phone strictly within verified registered organizations
    const cleanPhone = mediaMsg.from.replace(/[^0-9]/g, '');
    const client = await prisma.client.findFirst({
      where: {
        OR: [
          { whatsappPhone: cleanPhone },
          { whatsappPhone: `+${cleanPhone}` },
          { whatsappPhone: cleanPhone.replace(/^91/, '') },
        ],
        isActive: true,
      },
      include: { organization: true },
    });

    if (!client) {
      console.warn(`⚠️ [WhatsApp Multi-Tenant Guard] Unknown sender +${mediaMsg.from} is not registered under any active CA organization. Blocking allocation.`);
      const unregReply = `🙏 Namaste from KhataGenie!\n\nYour WhatsApp phone number (+${mediaMsg.from}) is not registered with any Chartered Accountant practice on our platform.\n\nPlease ask your CA to register your number in their KhataGenie Client Directory to enable automated invoice digitization.`;
      await this.sendTextMessage(mediaMsg.from, unregReply);
      return;
    }

    const organizationId = client.organizationId;

    // 2. Download media file
    const media = await this.downloadMedia(mediaMsg.mediaId);
    const fullDiskPath = path.join(process.cwd(), media.localPath);

    // 3. Create initial Invoice record scoped strictly to the client's verified organization
    const invoice = await prisma.invoice.create({
      data: {
        organizationId,
        clientId: client.id,
        senderPhone: cleanPhone,
        whatsappMessageId: mediaMsg.messageId,
        fileUrl: media.localPath,
        fileMimeType: media.mimeType,
        fileSizeBytes: media.size,
        status: InvoiceStatus.PROCESSING,
      },
    });

    // 4. Delegate to background extraction queue
    extractionQueue.enqueue(invoice.id, fullDiskPath, cleanPhone);
  }
}

export const whatsappService = new WhatsAppService();
