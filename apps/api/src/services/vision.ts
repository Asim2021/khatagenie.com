import { InvoiceExtractionSchema, InvoiceExtractionResult, InvoiceType } from '@khatagenie/types';
import { verifyInvoiceMath } from '@khatagenie/shared';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Dynamically sync latest .env credentials
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

export interface VisionServiceConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export class VisionService {
  private config: VisionServiceConfig;

  constructor(config?: Partial<VisionServiceConfig>) {
    this.config = {
      baseUrl: config?.baseUrl || process.env.AI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai',
      apiKey: config?.apiKey || process.env.AI_API_KEY || '',
      model: config?.model || process.env.AI_MODEL || 'gemini-3.7-flash',
    };
  }

  /**
   * Encodes a local image file to a base64 data URL with proper MIME detection.
   */
  private encodeImageToBase64(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    let mimeType = 'image/jpeg';
    if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.webp') mimeType = 'image/webp';
    else if (ext === '.heic') mimeType = 'image/heic';
    else if (ext === '.svg') mimeType = 'image/svg+xml';
    else if (ext === '.pdf') mimeType = 'application/pdf';

    const fileBuffer = fs.readFileSync(filePath);
    return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
  }

  /**
   * System Prompt tailored specifically for Indian Chartered Accountants & GST Invoices.
   */
  private getSystemPrompt(): string {
    return `You are an expert Indian Chartered Accountant OCR engine specializing in Indian GST invoices, cash receipts, and thermal bills.
Your job is to accurately extract financial, vendor, and tax details from the provided invoice image.

CRITICAL INDIAN GST RULES:
1. GSTIN is a 15-character alphanumeric string: 2-digit state code + 10-digit PAN + 1 entity number + 'Z' + 1 checksum (e.g. 07AAAAA0000A1Z5).
2. Supplier PAN corresponds to characters 3 through 12 of Supplier GSTIN.
3. Tax Heads:
   - Intra-state (same state): CGST amount and SGST amount should be equal.
   - Inter-state (different state): IGST amount applies.
4. Line Items: Extract description, HSN code, quantity, unit price, taxable amount, GST rate (%), CGST/SGST/IGST, and total.
5. All monetary amounts must be numbers in Indian Rupees (INR).

Return ONLY valid JSON matching this schema:
{
  "supplierName": string | null,
  "supplierGstin": string | null,
  "supplierAddress": string | null,
  "buyerGstin": string | null,
  "invoiceNumber": string | null,
  "invoiceDate": "YYYY-MM-DD" | null,
  "dueDate": "YYYY-MM-DD" | null,
  "invoiceType": "B2B_TAX_INVOICE" | "B2C_RETAIL_INVOICE" | "BILL_OF_SUPPLY" | "EXPENSE_VOUCHER" | "DEBIT_NOTE" | "CREDIT_NOTE",
  "taxableAmount": number | null,
  "cgstAmount": number | null,
  "sgstAmount": number | null,
  "igstAmount": number | null,
  "cessAmount": number | null,
  "roundOffAmount": number | null,
  "totalAmount": number | null,
  "isReverseCharge": boolean,
  "lineItems": [
    {
      "description": string,
      "hsnCode": string | null,
      "quantity": number | null,
      "unit": string | null,
      "unitPrice": number | null,
      "taxableAmount": number,
      "gstRate": number,
      "cgstAmount": number | null,
      "sgstAmount": number | null,
      "igstAmount": number | null,
      "totalAmount": number
    }
  ],
  "confidenceScore": number (0.0 to 1.0),
  "extractionNotes": string | null
}`;
  }

  private getEffectiveEndpoint(): { endpoint: string; apiKey: string; model: string } {
    try {
      dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });
    } catch {
      // ignore
    }

    let rawBase = (process.env.AI_BASE_URL || this.config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta/openai')
      .trim()
      .replace(/\/+$/, '');
    
    if (rawBase.includes('generativelanguage.googleapis.com')) {
      if (!rawBase.endsWith('/openai')) {
        rawBase = 'https://generativelanguage.googleapis.com/v1beta/openai';
      }
    }
    const endpoint = `${rawBase}/chat/completions`;
    const apiKey = process.env.AI_API_KEY || this.config.apiKey;
    const model = process.env.AI_MODEL || this.config.model || 'gemini-3.7-flash';
    return { endpoint, apiKey, model };
  }

  /**
   * Extracts structured invoice data from an image file path or public image URL.
   * Employs resilient model fallback (e.g. gemini-3.7-flash -> gemini-3.6-flash).
   */
  public async extractInvoiceData(imageSource: string, isLocalFile = false): Promise<{
    extraction: InvoiceExtractionResult;
    isMathValid: boolean;
    rawResponse: any;
  }> {
    let imageUrl = imageSource;

    if (isLocalFile && fs.existsSync(imageSource)) {
      imageUrl = this.encodeImageToBase64(imageSource);
    }

    const { endpoint, apiKey, model } = this.getEffectiveEndpoint();

    if (!apiKey) {
      throw new Error('AI Vision API Key is missing. Please provide a valid Gemini API key in configuration.');
    }
    
    // Model fallback sequence to survive temporary 503 spikes or deprecations
    const fallbackModels = [model, 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-2.5-pro']
      .filter((m, i, arr) => arr.indexOf(m) === i);

    let lastError: any = null;

    for (const modelToTry of fallbackModels) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: modelToTry,
            response_format: { type: 'json_object' },
            temperature: 0.1,
            messages: [
              {
                role: 'system',
                content: this.getSystemPrompt(),
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: 'Extract all structured GST and line item data from this invoice image.',
                  },
                  {
                    type: 'image_url',
                    image_url: { url: imageUrl },
                  },
                ],
              },
            ],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          // If model busy (503) or not found (404), try next model in fallback list
          if (response.status === 503 || response.status === 404) {
            console.warn(`[VisionService] Model ${modelToTry} returned HTTP ${response.status}. Trying next fallback model.`);
            lastError = new Error(`AI Vision Provider error (${response.status}): ${errorText}`);
            continue;
          }
          throw new Error(`AI Vision Provider error (${response.status}): ${errorText}`);
        }

        const responseData: any = await response.json();
        const contentStr = responseData.choices?.[0]?.message?.content;

        if (!contentStr) {
          throw new Error(`Empty response content from AI Vision model (${modelToTry}).`);
        }

        const parsedJson = JSON.parse(contentStr);
        const validated = InvoiceExtractionSchema.parse(parsedJson);

        const mathCheck = verifyInvoiceMath({
          taxableAmount: validated.taxableAmount,
          cgstAmount: validated.cgstAmount,
          sgstAmount: validated.sgstAmount,
          igstAmount: validated.igstAmount,
          cessAmount: validated.cessAmount,
          roundOffAmount: validated.roundOffAmount,
          totalAmount: validated.totalAmount,
        });

        return {
          extraction: validated,
          isMathValid: mathCheck.isValid,
          rawResponse: responseData,
        };
      } catch (err: any) {
        lastError = err;
        console.warn(`[VisionService] Extraction attempt with model ${modelToTry} failed: ${err.message}`);
      }
    }

    // If all model attempts failed, throw the genuine error to the queue
    throw new Error(lastError?.message || 'Vision AI extraction failed across all configured models.');
  }
}

export const visionService = new VisionService();
