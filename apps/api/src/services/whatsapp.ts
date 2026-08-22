import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma';
import { InvoiceStatus } from '@prisma/client';
import { extractionQueue } from './queue';

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

  constructor() {
    this.apiToken = process.env.WHATSAPP_API_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.appSecret = process.env.WHATSAPP_APP_SECRET || '';
    this.uploadsDir = path.join(process.cwd(), 'uploads');

    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Verifies SHA-256 signature from Meta webhook headers.
   */
  public verifySignature(rawBody: string, signatureHeader?: string): boolean {
    if (!this.appSecret || !signatureHeader) return true; // allow dev bypass if unset
    try {
      const signature = signatureHeader.replace('sha256=', '');
      const expectedSignature = crypto
        .createHmac('sha256', this.appSecret)
        .update(rawBody)
        .digest('hex');
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    } catch {
      return false;
    }
  }

  /**
   * Downloads media binary from Meta Cloud API v19.0.
   */
  public async downloadMedia(mediaId: string): Promise<{ localPath: string; mimeType: string; size: number }> {
    if (!this.apiToken) {
      // Return placeholder file in dev mode
      const dummyPath = path.join(this.uploadsDir, `wa_${mediaId}.jpg`);
      if (!fs.existsSync(dummyPath)) {
        fs.writeFileSync(dummyPath, Buffer.from('mock-image-bytes'));
      }
      return { localPath: `/uploads/wa_${mediaId}.jpg`, mimeType: 'image/jpeg', size: 1024 };
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
    const filename = `wa_${Date.now()}_${mediaId.slice(-6)}${ext}`;
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
      console.log(`[WhatsApp Mock Reply to ${toPhone}]: ${text}`);
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

    // 1. Look up client by sender phone
    const client = await prisma.client.findFirst({
      where: { whatsappPhone: mediaMsg.from },
      include: { organization: true },
    });

    // If client is found, use their CA firm; otherwise default to first active organization
    let organizationId = client?.organizationId;
    if (!organizationId) {
      const defaultOrg = await prisma.organization.findFirst();
      organizationId = defaultOrg?.id || '';
    }

    if (!organizationId) {
      console.error('No organization found to assign WhatsApp invoice.');
      return;
    }

    // 2. Download media file
    const media = await this.downloadMedia(mediaMsg.mediaId);
    const fullDiskPath = path.join(process.cwd(), media.localPath);

    // 3. Create initial Invoice record
    const invoice = await prisma.invoice.create({
      data: {
        organizationId,
        clientId: client?.id || null,
        senderPhone: mediaMsg.from,
        whatsappMessageId: mediaMsg.messageId,
        fileUrl: media.localPath,
        fileMimeType: media.mimeType,
        fileSizeBytes: media.size,
        status: InvoiceStatus.PROCESSING,
      },
    });

    // 4. Delegate to background extraction queue
    extractionQueue.enqueue(invoice.id, fullDiskPath, mediaMsg.from);
  }
}

export const whatsappService = new WhatsAppService();

