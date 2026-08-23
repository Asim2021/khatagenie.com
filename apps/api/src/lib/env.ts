import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const DEFAULT_JWT_SECRET = 'auth_token_C2kdts0r165wRAKP1AK1Os6zOnpxKyxE';
const DEFAULT_REFRESH_SECRET = 'auth_token_abcWm0G1jZ86KpqOP5BYl8ZPwBUZJFvUNk4acXBj59iK5hdfvNE7uW3E';

const envSchema = z
	.object({
		NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
		PORT: z.string().default('4000'),
		HOST: z.string().default('0.0.0.0'),
		DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/khatagenie?schema=public'),
		JWT_SECRET: z.string().min(16).default(DEFAULT_JWT_SECRET),
		JWT_REFRESH_SECRET: z.string().min(16).default(DEFAULT_REFRESH_SECRET),
		LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

		// AI Vision
		AI_BASE_URL: z.string().default('https://api.openai.com/v1'),
		AI_API_KEY: z.string().default('mock-dev-key'),
		AI_MODEL: z.string().default('gpt-4o-mini'),

		// WhatsApp Meta Cloud API
		WHATSAPP_API_TOKEN: z.string().optional().default(''),
		WHATSAPP_PHONE_NUMBER_ID: z.string().optional().default(''),
		WHATSAPP_VERIFY_TOKEN: z.string().default('khatagenie_verify_token_2026'),
		WHATSAPP_APP_SECRET: z.string().optional().default(''),

		// Cloud Object Storage (R2 / S3)
		STORAGE_PROVIDER: z.enum(['local', 's3', 'r2']).default('local'),
		S3_ENDPOINT: z.string().optional(),
		S3_REGION: z.string().default('auto'),
		S3_BUCKET: z.string().optional(),
		S3_ACCESS_KEY_ID: z.string().optional(),
		S3_SECRET_ACCESS_KEY: z.string().optional(),
	})
	.refine(
		(data) => {
			if (data.NODE_ENV === 'production') {
				if (data.JWT_SECRET === DEFAULT_JWT_SECRET) return false;
				if (data.JWT_REFRESH_SECRET === DEFAULT_REFRESH_SECRET) return false;
			}
			return true;
		},
		{
			message: 'In production mode, custom strong JWT_SECRET and JWT_REFRESH_SECRET must be explicitly provided.',
		},
	);

export const env = envSchema.parse(process.env);
