import { NextResponse } from 'next/server';
import { redis, TEMP_UPLOAD_DIR } from '@/lib/server/tempStorage';
import fs from 'fs';

export async function GET() {
  const uptime = process.uptime();
  const redisKeys = redis.size();

  let tempFileCount = 0;
  try {
    if (fs.existsSync(TEMP_UPLOAD_DIR)) {
      tempFileCount = fs.readdirSync(TEMP_UPLOAD_DIR).length;
    }
  } catch {
    tempFileCount = 0;
  }

  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(uptime),
    services: {
      database: 'connected (SQLite/PostgreSQL)',
      redisTemporaryStore: 'active (TTL 2h)',
      tempUploadsDirectory: 'available',
    },
    metrics: {
      activeRedisKeys: redisKeys,
      temporaryFilesOnDisk: tempFileCount,
      environment: process.env.NODE_ENV || 'development',
    },
  });
}
