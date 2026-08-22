import fs from 'fs';
import path from 'path';
import { env } from '../lib/env';

export interface StorageUploadResult {
  fileUrl: string;
  storageKey: string;
  sizeBytes: number;
  mimeType: string;
}

export interface StorageProvider {
  save(filename: string, buffer: Buffer, mimeType: string): Promise<StorageUploadResult>;
  read(storageKey: string): Promise<Buffer>;
  delete(storageKey: string): Promise<void>;
  getUrl(storageKey: string): string;
}

/**
 * Local Disk Storage Provider (Default for development and local testing)
 */
export class LocalDiskStorageProvider implements StorageProvider {
  private uploadsDir: string;

  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  public async save(filename: string, buffer: Buffer, mimeType: string): Promise<StorageUploadResult> {
    const sanitizedName = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(this.uploadsDir, sanitizedName);
    await fs.promises.writeFile(filePath, buffer);

    return {
      fileUrl: `/uploads/${sanitizedName}`,
      storageKey: sanitizedName,
      sizeBytes: buffer.length,
      mimeType,
    };
  }

  public async read(storageKey: string): Promise<Buffer> {
    const filePath = path.join(this.uploadsDir, storageKey);
    return fs.promises.readFile(filePath);
  }

  public async delete(storageKey: string): Promise<void> {
    const filePath = path.join(this.uploadsDir, storageKey);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }

  public getUrl(storageKey: string): string {
    return `/uploads/${storageKey}`;
  }
}

/**
 * Pluggable Storage Service Factory
 */
class StorageService {
  private provider: StorageProvider;

  constructor() {
    // In future with AWS SDK/R2, instantiate S3Provider when env.STORAGE_PROVIDER === 's3' | 'r2'
    this.provider = new LocalDiskStorageProvider();
  }

  public async saveFile(filename: string, buffer: Buffer, mimeType: string): Promise<StorageUploadResult> {
    return this.provider.save(filename, buffer, mimeType);
  }

  public async getFileBuffer(storageKey: string): Promise<Buffer> {
    return this.provider.read(storageKey);
  }

  public async deleteFile(storageKey: string): Promise<void> {
    return this.provider.delete(storageKey);
  }

  public getPublicUrl(storageKey: string): string {
    return this.provider.getUrl(storageKey);
  }
}

export const storageService = new StorageService();
