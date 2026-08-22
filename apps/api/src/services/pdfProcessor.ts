export interface ProcessedDocument {
  isPdf: boolean;
  pageCount: number;
  pageUrls: string[];
}

export const pdfProcessor = {
  async processDocument(filePath: string, mimeType: string, basePublicUrl: string): Promise<ProcessedDocument> {
    const isPdf = mimeType.includes('pdf');
    return {
      isPdf,
      pageCount: 1,
      pageUrls: [basePublicUrl],
    };
  },
};

