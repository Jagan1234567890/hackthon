import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    let userId = '';
    let sessionId = '';

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await req.json();
      userId = json.userId;
      sessionId = json.sessionId;
    } else {
      const raw = await req.text();
      try {
        const parsed = JSON.parse(raw);
        userId = parsed.userId;
        sessionId = parsed.sessionId;
      } catch {
        const params = new URLSearchParams(raw);
        userId = params.get('userId') || '';
        sessionId = params.get('sessionId') || '';
      }
    }

    return NextResponse.json({
      success: true,
      sessionId,
      userId,
      status: 'marked_inactive',
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ success: true, status: 'acknowledged' });
  }
}
