import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface StorageUploadResult {
  fileUrl: string;
  storageKey: string;
  sizeBytes: number;
  mimeType: string;
}

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const storageService = {
  async saveFile(filename: string, buffer: Buffer, mimeType: string): Promise<StorageUploadResult> {
    const rawExt = path.extname(filename).toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.heic', '.svg'].includes(rawExt) ? rawExt : '.jpg';
    const storageKey = `${crypto.randomUUID()}${safeExt}`;
    const filePath = path.join(uploadsDir, storageKey);
    
    await fs.promises.writeFile(filePath, buffer);

    return {
      fileUrl: `/uploads/${storageKey}`,
      storageKey,
      sizeBytes: buffer.length,
      mimeType,
    };
  },

  async getFileBuffer(storageKey: string): Promise<Buffer> {
    // Sanitize storageKey against path traversal attacks
    const safeKey = path.basename(storageKey);
    return fs.promises.readFile(path.join(uploadsDir, safeKey));
  },

  async deleteFile(storageKey: string): Promise<void> {
    const safeKey = path.basename(storageKey);
    const filePath = path.join(uploadsDir, safeKey);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  },

  getPublicUrl(storageKey: string): string {
    const safeKey = path.basename(storageKey);
    return `/uploads/${safeKey}`;
  },
};
