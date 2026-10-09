import { NextRequest, NextResponse } from 'next/server';
import { cleanupSessionData } from '@/lib/server/tempStorage';

export async function POST(req: NextRequest) {
  try {
    let userId = '';
    let sessionId = '';

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const json = await req.json();
      userId = json.userId || '';
      sessionId = json.sessionId || '';
    } else if (contentType.includes('text/plain') || contentType.includes('application/x-www-form-urlencoded')) {
      const raw = await req.text();
      try {
        const parsed = JSON.parse(raw);
        userId = parsed.userId || '';
        sessionId = parsed.sessionId || '';
      } catch {
        const params = new URLSearchParams(raw);
        userId = params.get('userId') || '';
        sessionId = params.get('sessionId') || '';
      }
    } else {
      const formData = await req.formData();
      userId = (formData.get('userId') as string) || '';
      sessionId = (formData.get('sessionId') as string) || '';
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required.' }, { status: 400 });
    }

    const { deletedKeys, deletedFiles } = await cleanupSessionData(
      userId || 'anonymous',
      sessionId
    );

    return NextResponse.json({
      success: true,
      sessionId,
      cleanedKeyCount: deletedKeys,
      cleanedFilesCount: deletedFiles,
      message: 'Temporary data and files destroyed. Persistent login preserved.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Cleanup failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
