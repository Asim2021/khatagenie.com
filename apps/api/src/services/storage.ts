import fs from 'fs';
import path from 'path';

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
    const sanitizedName = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(uploadsDir, sanitizedName);
    await fs.promises.writeFile(filePath, buffer);

    return {
      fileUrl: `/uploads/${sanitizedName}`,
      storageKey: sanitizedName,
      sizeBytes: buffer.length,
      mimeType,
    };
  },

  async getFileBuffer(storageKey: string): Promise<Buffer> {
    return fs.promises.readFile(path.join(uploadsDir, storageKey));
  },

  async deleteFile(storageKey: string): Promise<void> {
    const filePath = path.join(uploadsDir, storageKey);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  },

  getPublicUrl(storageKey: string): string {
    return `/uploads/${storageKey}`;
  },
};

