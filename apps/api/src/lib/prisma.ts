import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

// Lightweight cache for DB connectivity status to prevent query blocking in offline/local mock mode
let dbAvailableCache: { available: boolean; timestamp: number } | null = null;
const CACHE_TTL_MS = 60000; // 60 seconds

export async function isDatabaseOnline(): Promise<boolean> {
  const now = Date.now();
  if (dbAvailableCache && now - dbAvailableCache.timestamp < CACHE_TTL_MS) {
    return dbAvailableCache.available;
  }

  try {
    // Fast raw probe with 500ms timeout
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB_PROBE_TIMEOUT')), 500)),
    ]);
    dbAvailableCache = { available: true, timestamp: now };
    return true;
  } catch {
    dbAvailableCache = { available: false, timestamp: now };
    return false;
  }
}
